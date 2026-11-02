import {
  createObjectSchema,
  enumValue,
  nullableString,
  stringArray,
} from "../../llm-schema.utils";
import { RejectionReasonAnalysis } from "./interfaces/analyze-rejection-reason.interface";

export const analyzeRejectionReasonSchema =
  createObjectSchema<RejectionReasonAnalysis>("AnalyzeRejectionReasonOutput", {
    reason: nullableString,
    supportingPoints: stringArray,
    confidence: enumValue(["low", "medium", "high"] as const),
    severity: enumValue(["low", "medium", "high"] as const),
  });
