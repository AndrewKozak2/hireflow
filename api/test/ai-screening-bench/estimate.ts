import type { LlmModelTier } from "../../src/llm/interfaces/llm.interface";
import { aiScreeningTask } from "../../src/llm/tasks/ai-screening/ai-screening.task";
import { parseCvTask } from "../../src/llm/tasks/parse-cv/parse-cv.task";
import { splitRequirements } from "./loaders";
import { EMPTY_PARSED_CV, rawCvScreeningTask } from "./raw-cv-screening.task";
import { costOf, cvTextForPipeline } from "./runner";
import type {
  BenchConfig,
  BenchConfiguration,
  BenchDataset,
  PriceList,
} from "./types";

/**
 * Upper-bound token estimate without calling the API (token counting is itself
 * an API call). Two characters per token over-counts English (closer to four)
 * and stays safe for Cyrillic CVs; every answer is assumed to hit `maxTokens`.
 */
const CHARS_PER_TOKEN_UPPER_BOUND = 2;
/** The default system prompt in LlmClientService is ~40 tokens; rounded up. */
const SYSTEM_PROMPT_TOKENS = 100;

function tokens(text: string): number {
  return (
    Math.ceil(text.length / CHARS_PER_TOKEN_UPPER_BOUND) + SYSTEM_PROMPT_TOKENS
  );
}

export interface ModelPlan {
  model: string;
  calls: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxCostUsd: number | null;
}

export interface RunPlan {
  repeats: number;
  parseCalls: number;
  screeningCalls: number;
  byModel: ModelPlan[];
  /** Null when a model has no price in the price list. */
  maxCostUsd: number | null;
}

export function planRun(
  dataset: BenchDataset,
  config: BenchConfig,
  prices: PriceList,
  configurations: BenchConfiguration[],
  repeats: number,
): RunPlan {
  const byModel = new Map<string, ModelPlan>();
  const add = (tier: LlmModelTier, input: number, output: number) => {
    const model = config.models[tier];
    const plan = byModel.get(model) ?? {
      model,
      calls: 0,
      maxInputTokens: 0,
      maxOutputTokens: 0,
      maxCostUsd: 0,
    };
    plan.calls += repeats;
    plan.maxInputTokens += input * repeats;
    plan.maxOutputTokens += output * repeats;
    byModel.set(model, plan);
  };

  let parseCalls = 0;
  let screeningCalls = 0;
  const parsed = new Set<string>();
  for (const pair of dataset.pairs) {
    const cvText = cvTextForPipeline(pair.cv);
    const jobRequirements = splitRequirements(pair.job.requirements);
    for (const configuration of configurations) {
      screeningCalls += repeats;
      if (configuration.cvInput === "raw") {
        const prompt = rawCvScreeningTask.buildPrompt({
          jobTitle: pair.job.title,
          jobRequirements,
          rawCvText: cvText,
        });
        add(
          configuration.screenTier,
          tokens(prompt),
          rawCvScreeningTask.maxTokens ?? config.llm.maxTokens,
        );
        continue;
      }

      const parseTier = configuration.parseTier as LlmModelTier;
      const parseKey = `${pair.cv.id}|${parseTier}`;
      if (!parsed.has(parseKey)) {
        parsed.add(parseKey);
        parseCalls += repeats;
        add(
          parseTier,
          tokens(parseCvTask.buildPrompt({ extractedText: cvText })),
          parseCvTask.maxTokens ?? config.llm.maxTokens,
        );
      }
      // The parsed CV in the screening prompt can't be longer than the parse answer.
      const prefix = aiScreeningTask.buildPrompt({
        jobTitle: pair.job.title,
        jobRequirements,
        parsedCv: EMPTY_PARSED_CV,
      });
      add(
        configuration.screenTier,
        tokens(prefix) + (parseCvTask.maxTokens ?? config.llm.maxTokens),
        aiScreeningTask.maxTokens ?? config.llm.maxTokens,
      );
    }
  }

  let maxCostUsd: number | null = 0;
  for (const plan of byModel.values()) {
    plan.maxCostUsd = costOf(
      prices,
      plan.model,
      plan.maxInputTokens,
      plan.maxOutputTokens,
    );
    maxCostUsd =
      plan.maxCostUsd === null || maxCostUsd === null
        ? null
        : maxCostUsd + plan.maxCostUsd;
  }

  return {
    repeats,
    parseCalls,
    screeningCalls,
    byModel: [...byModel.values()],
    maxCostUsd,
  };
}

export function describePlan(plan: RunPlan, prices: PriceList): string {
  const lines = [
    `Planned calls: ${plan.parseCalls + plan.screeningCalls} (${plan.parseCalls} parse-cv + ${plan.screeningCalls} screening), ${plan.repeats} repeats.`,
    ...plan.byModel.map(
      (m) =>
        `  ${m.model}: ${m.calls} calls, ≤${m.maxInputTokens.toLocaleString("en-US")} input / ≤${m.maxOutputTokens.toLocaleString("en-US")} output tokens, ≤$${m.maxCostUsd === null ? "? (no price)" : m.maxCostUsd.toFixed(2)}`,
    ),
    `Upper bound: ${plan.maxCostUsd === null ? "unknown (a model has no price)" : `$${plan.maxCostUsd.toFixed(2)}`} at the ${prices.date} price list. Real usage is usually several times lower.`,
  ];
  return lines.join("\n");
}
