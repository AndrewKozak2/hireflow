import {
  createObjectSchema,
  enumValue,
  stringArray,
} from "../../llm-schema.utils";
import { LlmSchemaValidationError } from "../../llm.errors";
import { GeneratedAiScreening } from "./interfaces/ai-screening.interface";

function parsePercentage(value: unknown, key: string): number {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new LlmSchemaValidationError(
      `${key} must be an integer between 0 and 100`,
      { value },
    );
  }
  return score;
}

function requiredString(value: unknown, key: string): string {
  if (typeof value !== "string") {
    throw new LlmSchemaValidationError(`${key} must be a string`, { value });
  }
  return value;
}

export const aiScreeningSchema = createObjectSchema<GeneratedAiScreening>(
  "AiScreeningOutput",
  {
    matchPercentage: parsePercentage,
    recommendation: enumValue(["proceed", "review", "reject"] as const),
    summary: requiredString,
    extractedSkills: stringArray,
  },
);
