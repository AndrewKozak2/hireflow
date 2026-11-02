export interface ParseCvInput {
  extractedText: string;
  filename?: string | null;
}

export interface ParsedCvCandidateInfo {
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
  skills: string[];
  experienceSummary: string | null;
  education: string[];
  summary: string | null;
}
