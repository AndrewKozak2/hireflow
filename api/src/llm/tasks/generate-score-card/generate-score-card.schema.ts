import {
  createObjectSchema,
  enumValue,
  nullableString,
} from "../../llm-schema.utils";
import { LlmSchemaValidationError } from "../../llm.errors";
import { GeneratedScoreCard } from "./interfaces/generate-score-card.interface";

function parseCriteriaScore(value: unknown, key: string): number {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new LlmSchemaValidationError(
      `${key} must be an integer between 1 and 5`,
      { value },
    );
  }
  return score;
}

export const generateScoreCardSchema = createObjectSchema<GeneratedScoreCard>(
  "GenerateScoreCardOutput",
  {
    technicalSkillsScore: parseCriteriaScore,
    problemSolvingScore: parseCriteriaScore,
    communicationScore: parseCriteriaScore,
    teamFitScore: parseCriteriaScore,
    recommendation: enumValue(["proceed", "maybe", "reject"] as const),
    summaryComment: nullableString,
  },
);
