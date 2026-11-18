import { parseCsv, toCsv } from "./csv";
import { csvToRows, rowsToCsv } from "./results";
import type { CallRow } from "./types";

describe("csv", () => {
  it("round-trips commas, quotes, newlines and empty values", () => {
    const records = [
      ["plain", 'say "hi"', "a,b", "line 1\nline 2\r\nline 3", null, 42],
      ["", "", "", "", "", 0],
    ];
    const text = toCsv(["a", "b", "c", "d", "e", "f"], records);

    expect(parseCsv(text)).toEqual([
      ["a", "b", "c", "d", "e", "f"],
      ["plain", 'say "hi"', "a,b", "line 1\nline 2\r\nline 3", "", "42"],
      ["", "", "", "", "", "0"],
    ]);
  });

  it("refuses a file that ends inside a quoted field", () => {
    expect(() => parseCsv('a,"unterminated\n')).toThrow(
      "inside a quoted field",
    );
  });
});

describe("calls.csv rows", () => {
  const row: CallRow = {
    callId: "c00002",
    repeat: 1,
    configuration: "heavy",
    task: "ai-screening",
    pairId: "cv-01__job-backend-node",
    cvId: "cv-01",
    jobId: "job-backend-node",
    tier: "heavy",
    modelRequested: "claude-sonnet-4-6",
    modelResponded: "claude-sonnet-4-6",
    sdkVersion: "0.137.0",
    status: "ok",
    attempts: 1,
    inputTokens: 812,
    outputTokens: 164,
    costUsd: 0.004896,
    latencyMs: 2345.6,
    dependsOn: "c00001",
    matchPercentage: 82,
    recommendation: "proceed",
    humanRecommendation: "review",
    humanScore: null,
    stopReason: "end_turn",
    error: "",
    rawText:
      '{\n  "matchPercentage": 82,\n  "summary": "Strong, uses \\"NestJS\\", Postgres"\n}',
    startedAt: "2026-11-02T18:00:00.000Z",
  };

  it("survive a write and a read unchanged", () => {
    expect(csvToRows(rowsToCsv([row]))).toEqual([row]);
  });

  it("keep nulls as nulls", () => {
    const failed: CallRow = {
      ...row,
      status: "timeout",
      inputTokens: null,
      outputTokens: null,
      costUsd: null,
      latencyMs: null,
      matchPercentage: null,
      recommendation: null,
    };
    expect(csvToRows(rowsToCsv([failed]))).toEqual([failed]);
  });

  it("reject a file with a different header", () => {
    expect(() => csvToRows("call_id,status\r\nc1,ok\r\n")).toThrow(
      "unexpected header",
    );
  });
});
