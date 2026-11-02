import { LlmTask } from "../../interfaces/llm.interface";
import {
  ParsedCvCandidateInfo,
  ParseCvInput,
} from "./interfaces/parse-cv.interface";
import { parseCvSchema } from "./parse-cv.schema";

export const parseCvTask: LlmTask<ParseCvInput, ParsedCvCandidateInfo> = {
  name: "parse-cv",
  tier: "light",
  temperature: 0,
  maxTokens: 1200,
  outputSchema: parseCvSchema,
  buildPrompt(input) {
    return [
      "Extract candidate information from this raw CV/resume text.",
      "Return JSON with exactly these keys:",
      "candidateName, email, phone, location, links, skills, experienceSummary, education, summary.",
      "Use only information explicitly present in the CV text.",
      "Do not infer, guess, enrich, or hallucinate missing information.",
      "Use null for missing scalar fields and [] for missing arrays.",
      "skills should contain concise skill names or technologies.",
      "education should contain concise education entries as strings.",
      "experienceSummary should summarize roles, seniority, domains, and relevant experience from the CV.",
      "summary should be a short recruiter-friendly candidate summary.",
      "",
      `Filename: ${input.filename ?? "unknown"}`,
      "",
      "CV text:",
      input.extractedText,
    ].join("\n");
  },
};
