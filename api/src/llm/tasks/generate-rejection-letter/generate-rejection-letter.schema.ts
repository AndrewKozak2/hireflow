import {
  createObjectSchema,
  enumValue,
  stringArray,
  stringValue,
} from "../../llm-schema.utils";
import { GeneratedRejectionLetterDraft } from "./interfaces/generate-rejection-letter.interface";

export const generateRejectionLetterSchema =
  createObjectSchema<GeneratedRejectionLetterDraft>(
    "GenerateRejectionLetterOutput",
    {
      subject: stringValue,
      body: stringValue,
      tone: enumValue(["neutral", "warm", "concise"] as const),
      usedContext: stringArray,
      guardrailNotes: stringArray,
    },
  );
