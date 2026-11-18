import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { LlmModelTier } from "../../src/llm/interfaces/llm.interface";
import type { AiScreeningRecommendation } from "../../src/llm/tasks/ai-screening/interfaces/ai-screening.interface";
import { CsvValue, parseCsv, toCsv } from "./csv";
import type { BenchTaskName, CallRow, CallStatus, RunMeta } from "./types";

export const CALLS_FILE = "calls.csv";
export const META_FILE = "run.json";
export const REPORT_FILE = "report.md";

type Column = {
  [Key in keyof CallRow]: { key: Key; header: string };
}[keyof CallRow];

/** Column order of calls.csv. */
const COLUMNS: Column[] = [
  { key: "callId", header: "call_id" },
  { key: "repeat", header: "repeat" },
  { key: "configuration", header: "configuration" },
  { key: "task", header: "task" },
  { key: "pairId", header: "pair_id" },
  { key: "cvId", header: "cv_id" },
  { key: "jobId", header: "job_id" },
  { key: "tier", header: "tier" },
  { key: "modelRequested", header: "model_requested" },
  { key: "modelResponded", header: "model_responded" },
  { key: "sdkVersion", header: "sdk_version" },
  { key: "status", header: "status" },
  { key: "attempts", header: "attempts" },
  { key: "inputTokens", header: "input_tokens" },
  { key: "outputTokens", header: "output_tokens" },
  { key: "costUsd", header: "cost_usd" },
  { key: "latencyMs", header: "latency_ms" },
  { key: "dependsOn", header: "depends_on" },
  { key: "matchPercentage", header: "match_percentage" },
  { key: "recommendation", header: "recommendation" },
  { key: "humanRecommendation", header: "human_recommendation" },
  { key: "humanScore", header: "human_score" },
  { key: "stopReason", header: "stop_reason" },
  { key: "error", header: "error" },
  { key: "rawText", header: "raw_text" },
  { key: "startedAt", header: "started_at" },
];

function toCsvValue(row: CallRow, key: keyof CallRow): CsvValue {
  const value = row[key];
  if (key === "latencyMs" && typeof value === "number") {
    return Math.round(value * 10) / 10;
  }
  return value;
}

export function rowsToCsv(rows: CallRow[]): string {
  return toCsv(
    COLUMNS.map((c) => c.header),
    rows.map((row) => COLUMNS.map((c) => toCsvValue(row, c.key))),
  );
}

function nullableNumber(value: string): number | null {
  if (value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`calls.csv: "${value}" is not a number`);
  }
  return number;
}

function nullableText<T extends string>(value: string): T | null {
  return value === "" ? null : (value as T);
}

export function csvToRows(text: string): CallRow[] {
  const [header, ...records] = parseCsv(text);
  const expected = COLUMNS.map((c) => c.header);
  if (!header || header.join(",") !== expected.join(",")) {
    throw new Error(
      "calls.csv: unexpected header; was it written by this bench?",
    );
  }

  return records.map((record, index) => {
    if (record.length !== expected.length) {
      throw new Error(
        `calls.csv: row ${index + 2} has ${record.length} fields, expected ${expected.length}`,
      );
    }
    const field = (name: string) => record[expected.indexOf(name)];
    return {
      callId: field("call_id"),
      repeat: Number(field("repeat")),
      configuration: field("configuration"),
      task: field("task") as BenchTaskName,
      pairId: field("pair_id"),
      cvId: field("cv_id"),
      jobId: field("job_id"),
      tier: field("tier") as LlmModelTier,
      modelRequested: field("model_requested"),
      modelResponded: field("model_responded"),
      sdkVersion: field("sdk_version"),
      status: field("status") as CallStatus,
      attempts: Number(field("attempts")),
      inputTokens: nullableNumber(field("input_tokens")),
      outputTokens: nullableNumber(field("output_tokens")),
      costUsd: nullableNumber(field("cost_usd")),
      latencyMs: nullableNumber(field("latency_ms")),
      dependsOn: field("depends_on"),
      matchPercentage: nullableNumber(field("match_percentage")),
      recommendation: nullableText<AiScreeningRecommendation>(
        field("recommendation"),
      ),
      humanRecommendation: nullableText<AiScreeningRecommendation>(
        field("human_recommendation"),
      ),
      humanScore: nullableNumber(field("human_score")),
      stopReason: field("stop_reason"),
      error: field("error"),
      rawText: field("raw_text"),
      startedAt: field("started_at"),
    };
  });
}

export function writeRunFiles(
  dir: string,
  rows: CallRow[],
  meta: RunMeta,
): void {
  writeFileSync(join(dir, CALLS_FILE), rowsToCsv(rows), "utf8");
  writeFileSync(
    join(dir, META_FILE),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8",
  );
}

export function readRunFiles(dir: string): { rows: CallRow[]; meta: RunMeta } {
  return {
    rows: csvToRows(readFileSync(join(dir, CALLS_FILE), "utf8")),
    meta: JSON.parse(readFileSync(join(dir, META_FILE), "utf8")) as RunMeta,
  };
}
