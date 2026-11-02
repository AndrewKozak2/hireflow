import { createObjectSchema, enumValue } from "../../llm-schema.utils";
import { LlmSchemaValidationError } from "../../llm.errors";
import {
  MatchedJob,
  MatchApplicationToJobOutput,
} from "./interfaces/match-application-to-job.interface";

const matchedJobSchema = createObjectSchema<MatchedJob>("MatchedJob", {
  jobId: (value, key) => {
    if (typeof value !== "string" || !value) {
      throw new LlmSchemaValidationError(`${key} must be a non-empty string`, {
        value,
      });
    }
    return value;
  },
  confidence: enumValue(["high", "medium", "low"]),
  reason: (value, key) => {
    if (typeof value !== "string" || !value) {
      throw new LlmSchemaValidationError(`${key} must be a non-empty string`, {
        value,
      });
    }
    return value;
  },
});

export const matchApplicationToJobSchema = {
  name: "Array<MatchedJob>",
  parse: (value: unknown): MatchApplicationToJobOutput => {
    if (!Array.isArray(value)) {
      throw new LlmSchemaValidationError("Output must be an array of jobs", {
        value,
      });
    }
    return value.map((item) => matchedJobSchema.parse(item));
  },
};
