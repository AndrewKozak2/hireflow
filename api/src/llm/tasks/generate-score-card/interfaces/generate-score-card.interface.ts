export interface InterviewNoteInput {
  interviewerRole: "recruiter" | "hiring_manager";
  content: string;
}

export interface GenerateScoreCardInput {
  jobTitle: string;
  jobRequirements: string[];
  candidateResume: string;
  interviewNotes: InterviewNoteInput[];
}

export type ScoreCardRecommendationType = "proceed" | "maybe" | "reject";

export interface GeneratedScoreCard {
  technicalSkillsScore: number;
  problemSolvingScore: number;
  communicationScore: number;
  teamFitScore: number;
  recommendation: ScoreCardRecommendationType;
  summaryComment: string | null;
}
