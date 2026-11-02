import { LlmTask } from "../../interfaces/llm.interface";
import { analyzeRejectionReasonSchema } from "./analyze-rejection-reason.schema";
import {
  AnalyzeRejectionReasonInput,
  RejectionReasonAnalysis,
} from "./interfaces/analyze-rejection-reason.interface";

export const analyzeRejectionReasonTask: LlmTask<
  AnalyzeRejectionReasonInput,
  RejectionReasonAnalysis
> = {
  name: "analyze-rejection-reason",
  tier: "heavy",
  temperature: 0.2,
  maxTokens: 1_200,
  outputSchema: analyzeRejectionReasonSchema,
  buildPrompt(input) {
    return [
      "Analyze this application lifecycle and infer a concise rejection reason.",
      "Return JSON with exactly these keys:",
      "reason, supportingPoints, confidence, severity.",
      "supportingPoints must reference concrete facts from transitions, comments, or scores.",
      "confidence and severity must each be one of: low, medium, high.",
      "",
      JSON.stringify(input, null, 2),
    ].join("\n");
  },
};
