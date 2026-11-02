import { VERSION as SDK_VERSION } from "@anthropic-ai/sdk/version";
import type {
  LlmModelTier,
  LlmTask,
} from "../../src/llm/interfaces/llm.interface";
import { aiScreeningTask } from "../../src/llm/tasks/ai-screening/ai-screening.task";
import type { GeneratedAiScreening } from "../../src/llm/tasks/ai-screening/interfaces/ai-screening.interface";
import type { ParsedCvCandidateInfo } from "../../src/llm/tasks/parse-cv/interfaces/parse-cv.interface";
import { parseCvTask } from "../../src/llm/tasks/parse-cv/parse-cv.task";
import {
  CallOutcome,
  MessagesApi,
  runInstrumentedTask,
} from "./instrumented-llm";
import { splitRequirements } from "./loaders";
import { rawCvScreeningTask } from "./raw-cv-screening.task";
import type {
  BenchConfig,
  BenchConfiguration,
  BenchCv,
  BenchDataset,
  BenchPair,
  BenchTaskName,
  CallRow,
  PriceList,
} from "./types";

/** Production cuts the extracted CV text at this length before parse-cv (applications.service.ts). */
export const MAX_CV_TEXT_LENGTH = 40_000;

export interface RunOptions {
  dataset: BenchDataset;
  config: BenchConfig;
  prices: PriceList;
  api: MessagesApi;
  /** Defaults to `config.configurations` / `config.repeats`. */
  configurations?: BenchConfiguration[];
  repeats?: number;
  /** Stop starting new calls once the recorded cost passes this. */
  maxCostUsd?: number;
  /** Wait between transport retries; replaced with a no-op in tests. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
  onRow?: (row: CallRow) => void;
}

export interface RunResult {
  rows: CallRow[];
  aborted: string | null;
}

export function cvTextForPipeline(cv: BenchCv): string {
  return cv.text.length > MAX_CV_TEXT_LENGTH
    ? cv.text.slice(0, MAX_CV_TEXT_LENGTH)
    : cv.text;
}

export function costOf(
  prices: PriceList,
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
): number | null {
  const price = prices.models[model];
  if (!price || inputTokens === null || outputTokens === null) return null;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

class BudgetExceeded extends Error {}

/**
 * Runs every pair through every configuration, `repeats` times.
 *
 * Per repeat, each CV is parsed once per parse tier and that parse is shared by
 * every configuration and job that uses it: configurations that differ only in
 * the screening model then see the same parsed CV (a paired comparison), while
 * each repeat still parses afresh, so stability is measured end to end.
 * Calls run one at a time, so latency is not distorted by concurrency.
 */
export async function runBench(options: RunOptions): Promise<RunResult> {
  const { dataset, config, prices, api } = options;
  const configurations = options.configurations ?? config.configurations;
  const repeats = options.repeats ?? config.repeats;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = options.now ?? (() => new Date());

  const rows: CallRow[] = [];
  let spentUsd = 0;
  let sequence = 0;

  const record = (row: CallRow) => {
    rows.push(row);
    spentUsd += row.costUsd ?? 0;
    options.onRow?.(row);
  };

  async function call<Input, Output>(
    task: LlmTask<Input, Output>,
    input: Input,
    tier: LlmModelTier,
    context: Pick<
      CallRow,
      "repeat" | "configuration" | "pairId" | "cvId" | "jobId" | "dependsOn"
    > & {
      pair?: BenchPair;
    },
  ): Promise<{ row: CallRow; output: Output | null }> {
    if (options.maxCostUsd !== undefined && spentUsd >= options.maxCostUsd) {
      throw new BudgetExceeded(
        `Stopped: recorded cost $${spentUsd.toFixed(4)} reached the limit $${options.maxCostUsd.toFixed(4)}`,
      );
    }
    sequence += 1;
    const startedAt = now().toISOString();
    let outcome: CallOutcome<Output> | undefined;
    let attempts = 0;
    while (attempts < config.transportAttempts) {
      attempts += 1;
      outcome = await runInstrumentedTask(api, config, task, input, tier);
      if (!outcome.retryable || attempts === config.transportAttempts) break;
      await sleep(2_000 * attempts);
    }
    const result = outcome as CallOutcome<Output>;
    const screening = result.output as Partial<GeneratedAiScreening> | null;
    const isScreening = task.name !== parseCvTask.name;

    const row: CallRow = {
      callId: `c${String(sequence).padStart(5, "0")}`,
      repeat: context.repeat,
      configuration: context.configuration,
      task: task.name as BenchTaskName,
      pairId: context.pairId,
      cvId: context.cvId,
      jobId: context.jobId,
      tier,
      modelRequested: result.modelRequested,
      modelResponded: result.modelResponded,
      sdkVersion: SDK_VERSION,
      status: result.status,
      attempts,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: costOf(
        prices,
        result.modelRequested,
        result.inputTokens,
        result.outputTokens,
      ),
      latencyMs: result.latencyMs,
      dependsOn: context.dependsOn,
      matchPercentage: isScreening
        ? (screening?.matchPercentage ?? null)
        : null,
      recommendation: isScreening ? (screening?.recommendation ?? null) : null,
      humanRecommendation: context.pair?.label.recommendation ?? null,
      humanScore: context.pair?.label.score ?? null,
      stopReason: result.stopReason,
      error: result.error,
      rawText: result.rawText,
      startedAt,
    };
    record(row);
    return { row, output: result.output };
  }

  try {
    for (let repeat = 1; repeat <= repeats; repeat += 1) {
      const parses = new Map<
        string,
        { row: CallRow; output: ParsedCvCandidateInfo | null }
      >();

      for (const pair of dataset.pairs) {
        const cvText = cvTextForPipeline(pair.cv);
        const jobRequirements = splitRequirements(pair.job.requirements);
        const pairContext = {
          repeat,
          pairId: pair.id,
          cvId: pair.cv.id,
          jobId: pair.job.id,
          pair,
        };

        for (const configuration of configurations) {
          if (configuration.cvInput === "raw") {
            await call(
              rawCvScreeningTask,
              { jobTitle: pair.job.title, jobRequirements, rawCvText: cvText },
              configuration.screenTier,
              {
                ...pairContext,
                configuration: configuration.name,
                dependsOn: "",
              },
            );
            continue;
          }

          const parseTier = configuration.parseTier as LlmModelTier;
          const parseKey = `${pair.cv.id}|${parseTier}`;
          let parse = parses.get(parseKey);
          if (!parse) {
            parse = await call(
              parseCvTask,
              { extractedText: cvText },
              parseTier,
              {
                repeat,
                configuration: "",
                pairId: "",
                cvId: pair.cv.id,
                jobId: "",
                dependsOn: "",
              },
            );
            parses.set(parseKey, parse);
          }

          if (parse.row.status !== "ok" || !parse.output) {
            record(
              skippedScreening(
                pair,
                configuration,
                repeat,
                parse.row,
                ++sequence,
                now(),
              ),
            );
            continue;
          }

          await call(
            aiScreeningTask,
            {
              jobTitle: pair.job.title,
              jobRequirements,
              parsedCv: parse.output,
            },
            configuration.screenTier,
            {
              ...pairContext,
              configuration: configuration.name,
              dependsOn: parse.row.callId,
            },
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof BudgetExceeded) {
      return { rows, aborted: error.message };
    }
    throw error;
  }

  return { rows, aborted: null };

  function skippedScreening(
    pair: BenchPair,
    configuration: BenchConfiguration,
    repeat: number,
    parseRow: CallRow,
    seq: number,
    at: Date,
  ): CallRow {
    return {
      callId: `c${String(seq).padStart(5, "0")}`,
      repeat,
      configuration: configuration.name,
      task: aiScreeningTask.name as BenchTaskName,
      pairId: pair.id,
      cvId: pair.cv.id,
      jobId: pair.job.id,
      tier: configuration.screenTier,
      modelRequested: config.models[configuration.screenTier],
      modelResponded: "",
      sdkVersion: SDK_VERSION,
      status: "skipped",
      attempts: 0,
      inputTokens: null,
      outputTokens: null,
      costUsd: null,
      latencyMs: null,
      dependsOn: parseRow.callId,
      matchPercentage: null,
      recommendation: null,
      humanRecommendation: pair.label.recommendation,
      humanScore: pair.label.score,
      stopReason: "",
      error: `parse-cv ${parseRow.callId} ended with status ${parseRow.status}`,
      rawText: "",
      startedAt: at.toISOString(),
    };
  }
}
