import { summarizeConfiguration } from "./report";
import type { BenchConfiguration, CallRow } from "./types";

const HEAVY: BenchConfiguration = {
  name: "heavy",
  cvInput: "parsed",
  parseTier: "light",
  screenTier: "heavy",
};

function row(overrides: Partial<CallRow>): CallRow {
  return {
    callId: "c0",
    repeat: 1,
    configuration: "heavy",
    task: "ai-screening",
    pairId: "cv-a__job-a",
    cvId: "cv-a",
    jobId: "job-a",
    tier: "heavy",
    modelRequested: "model-heavy",
    modelResponded: "model-heavy",
    sdkVersion: "0.137.0",
    status: "ok",
    attempts: 1,
    inputTokens: 100,
    outputTokens: 10,
    costUsd: 0.02,
    latencyMs: 1000,
    dependsOn: "",
    matchPercentage: 80,
    recommendation: "proceed",
    humanRecommendation: "proceed",
    humanScore: 90,
    stopReason: "end_turn",
    error: "",
    rawText: "{}",
    startedAt: "2026-11-02T00:00:00.000Z",
    ...overrides,
  };
}

const parse = (overrides: Partial<CallRow>) =>
  row({
    configuration: "",
    task: "parse-cv",
    pairId: "",
    jobId: "",
    tier: "light",
    matchPercentage: null,
    recommendation: null,
    humanRecommendation: null,
    humanScore: null,
    ...overrides,
  });

describe("summarizeConfiguration — cost per screening", () => {
  it("averages over every screening and charges the parse each one relied on, even when it failed", () => {
    const rows = [
      parse({ callId: "p1", costUsd: 0.01, latencyMs: 500 }),
      row({ callId: "s1", dependsOn: "p1", costUsd: 0.02 }),
      // Timed out: no usage of its own, but its parse was paid for.
      row({
        callId: "s2",
        dependsOn: "p1",
        status: "timeout",
        inputTokens: null,
        outputTokens: null,
        costUsd: null,
        latencyMs: null,
        matchPercentage: null,
        recommendation: null,
      }),
      parse({ callId: "p2", status: "invalid_json", costUsd: 0.005 }),
      // Skipped because p2 failed: costs exactly that failed parse.
      row({
        callId: "s3",
        pairId: "cv-b__job-a",
        dependsOn: "p2",
        status: "skipped",
        attempts: 0,
        inputTokens: null,
        outputTokens: null,
        costUsd: null,
        latencyMs: null,
        matchPercentage: null,
        recommendation: null,
      }),
    ];

    const summary = summarizeConfiguration(HEAVY, rows);

    expect(summary.meanCostUsd).toBeCloseTo((0.03 + 0.01 + 0.005) / 3, 12);
    expect(summary.attempted).toBe(2);
    expect(summary.skipped).toBe(1);
    expect(summary.ok).toBe(1);
    expect(summary.endToEndLatencyP50).toBe(1500);
  });

  it("is unknown when a call that used tokens has no price", () => {
    const rows = [
      parse({ callId: "p1", costUsd: 0.01 }),
      row({ callId: "s1", dependsOn: "p1", costUsd: null }),
    ];

    expect(summarizeConfiguration(HEAVY, rows).meanCostUsd).toBeNull();
  });
});
