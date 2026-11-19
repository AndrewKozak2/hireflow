import {
  createObjectSchema,
  nullableString,
  stringArray,
  optionalStringArray,
  nullableBoolean,
} from "../../llm-schema.utils";
import { ParsedApplicationEmailCandidateInfo } from "./interfaces/parse-application-email.interface";

export const parseApplicationEmailSchema =
  createObjectSchema<ParsedApplicationEmailCandidateInfo>(
    "ParseApplicationEmailOutput",
    {
      candidateName: nullableString,
      email: nullableString,
      phone: nullableString,
      appliedRole: nullableString,
      location: nullableString,
      links: stringArray,
      summary: nullableString,
      isApplication: nullableBoolean,
      appliedJobTitles: optionalStringArray,
    },
  );
