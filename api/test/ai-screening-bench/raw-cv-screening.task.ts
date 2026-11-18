import type { LlmTask } from "../../src/llm/interfaces/llm.interface";
import { aiScreeningTask } from "../../src/llm/tasks/ai-screening/ai-screening.task";
import type { GeneratedAiScreening } from "../../src/llm/tasks/ai-screening/interfaces/ai-screening.interface";
import type { ParsedCvCandidateInfo } from "../../src/llm/tasks/parse-cv/interfaces/parse-cv.interface";

export const RESUME_MARKER = "=== CANDIDATE RESUME ===";

export interface RawCvScreeningInput {
  jobTitle: string;
  jobRequirements: string[];
  rawCvText: string;
}

export const EMPTY_PARSED_CV: ParsedCvCandidateInfo = {
  candidateName: null,
  email: null,
  phone: null,
  location: null,
  links: [],
  skills: [],
  experienceSummary: null,
  education: [],
  summary: null,
};

/**
 * Ablation: the production screening prompt, unchanged up to and including the
 * resume marker, followed by the raw CV text instead of the parsed summary.
 * Tier, temperature, maxTokens and the output schema are inherited, so the
 * parsed summary is the only thing that differs from `aiScreeningTask`.
 */
export const rawCvScreeningTask: LlmTask<
  RawCvScreeningInput,
  GeneratedAiScreening
> = {
  ...aiScreeningTask,
  name: "ai-screening-raw-cv",
  buildPrompt(input) {
    const productionPrompt = aiScreeningTask.buildPrompt({
      jobTitle: input.jobTitle,
      jobRequirements: input.jobRequirements,
      parsedCv: EMPTY_PARSED_CV,
    });
    const markerAt = productionPrompt.indexOf(RESUME_MARKER);
    if (
      markerAt === -1 ||
      productionPrompt.indexOf(RESUME_MARKER, markerAt + 1) !== -1
    ) {
      throw new Error(
        `Expected "${RESUME_MARKER}" exactly once in the ai-screening prompt; the ablation can't be built`,
      );
    }
    return `${productionPrompt.slice(0, markerAt + RESUME_MARKER.length)}\n${input.rawCvText}`;
  },
};
