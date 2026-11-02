import { ParsedCvCandidateInfo } from "../../parse-cv/interfaces/parse-cv.interface";

export interface AiScreeningInput {
  jobTitle: string;
  jobRequirements: string[];
  parsedCv: ParsedCvCandidateInfo;
}

export type AiScreeningRecommendation = "proceed" | "review" | "reject";

export interface GeneratedAiScreening {
  matchPercentage: number;
  recommendation: AiScreeningRecommendation;
  summary: string;
  extractedSkills: string[];
}
