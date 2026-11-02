import {
  createObjectSchema,
  nullableString,
  stringArray,
} from "../../llm-schema.utils";
import { ParsedCvCandidateInfo } from "./interfaces/parse-cv.interface";

export const parseCvSchema = createObjectSchema<ParsedCvCandidateInfo>(
  "ParseCvOutput",
  {
    candidateName: nullableString,
    email: nullableString,
    phone: nullableString,
    location: nullableString,
    links: stringArray,
    skills: stringArray,
    experienceSummary: nullableString,
    education: stringArray,
    summary: nullableString,
  },
);
