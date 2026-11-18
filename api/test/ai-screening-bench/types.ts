import type { LlmModelTier } from "../../src/llm/interfaces/llm.interface";
import type { AiScreeningRecommendation } from "../../src/llm/tasks/ai-screening/interfaces/ai-screening.interface";

/** Ordered from worst to best, so the index doubles as the ordinal value for weighted kappa. */
export const RECOMMENDATIONS: readonly AiScreeningRecommendation[] = [
  "reject",
  "review",
  "proceed",
];

export interface BenchJob {
  id: string;
  title: string;
  /** Newline-separated, the way `Job.requirements` is stored in the database. */
  requirements: string;
}

export interface BenchCv {
  id: string;
  filename: string;
  text: string;
}

/** One human judgment of a (CV, job) pair. `null` means "not labelled yet". */
export interface HumanLabel {
  cvId: string;
  jobId: string;
  recommendation: AiScreeningRecommendation | null;
  score: number | null;
  labeller: string | null;
  labelledAt: string | null;
  notes?: string;
}

export interface BenchPair {
  id: string;
  cv: BenchCv;
  job: BenchJob;
  label: HumanLabel;
}

export interface BenchDataset {
  dir: string;
  jobs: BenchJob[];
  cvs: BenchCv[];
  pairs: BenchPair[];
}

/**
 * How one screening is produced. `cvInput: "parsed"` is the production flow
 * (parse-cv, then ai-screening on the parsed CV); `"raw"` is the ablation where
 * screening reads the raw CV text and parse-cv is skipped.
 */
export interface BenchConfiguration {
  name: string;
  cvInput: "parsed" | "raw";
  parseTier?: LlmModelTier;
  screenTier: LlmModelTier;
}

export interface BenchConfig {
  sdkVersion: string;
  models: Record<LlmModelTier, string>;
  llm: { temperature: number; maxTokens: number; timeoutMs: number };
  repeats: number;
  transportAttempts: number;
  priceList: string;
  configurations: BenchConfiguration[];
}

export interface ModelPrice {
  /** USD per million input tokens. */
  input: number;
  /** USD per million output tokens. */
  output: number;
}

export interface PriceList {
  date: string;
  source: string;
  currency: string;
  models: Record<string, ModelPrice>;
}

export type CallStatus =
  | "ok"
  | "invalid_json"
  | "schema_invalid"
  | "empty"
  | "timeout"
  | "api_error"
  /** Screening not attempted because the parse-cv call it depends on failed. */
  | "skipped";

export type BenchTaskName = "parse-cv" | "ai-screening" | "ai-screening-raw-cv";

/** One row of `calls.csv`: one LLM call (or one skipped screening). */
export interface CallRow {
  callId: string;
  repeat: number;
  /** Empty for parse-cv rows: a parse is shared by every configuration that uses it. */
  configuration: string;
  task: BenchTaskName;
  pairId: string;
  cvId: string;
  jobId: string;
  tier: LlmModelTier;
  modelRequested: string;
  modelResponded: string;
  sdkVersion: string;
  status: CallStatus;
  attempts: number;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  /** The parse-cv call whose output this screening used. */
  dependsOn: string;
  matchPercentage: number | null;
  recommendation: AiScreeningRecommendation | null;
  humanRecommendation: AiScreeningRecommendation | null;
  humanScore: number | null;
  stopReason: string;
  error: string;
  rawText: string;
  startedAt: string;
}

export interface RunMeta {
  runId: string;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  sdkVersion: string;
  models: Record<LlmModelTier, string>;
  priceList: { date: string; source: string; currency: string };
  repeats: number;
  configurations: BenchConfiguration[];
  dataset: {
    dir: string;
    jobs: number;
    cvs: number;
    pairs: number;
    labelledPairs: number;
  };
  aborted: string | null;
}
