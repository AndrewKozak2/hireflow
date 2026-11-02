export type RejectionLetterTone = "neutral" | "warm" | "concise";

export interface RejectionLetterCandidateInput {
  name: string | null;
  email?: string | null;
}

export interface RejectionLetterJobInput {
  title: string | null;
  department?: string | null;
}

export interface RejectionLetterSenderInput {
  name: string | null;
  role?: string | null;
  companyName?: string | null;
}

export interface RejectionLetterStageNoteInput {
  stage: string;
  noteType:
    | "screening"
    | "pre_interview"
    | "technical_interview"
    | "offer"
    | "score_card"
    | "rejection"
    | "general";
  text: string;
  createdAt?: string | null;
  authorRole?: string | null;
}

export interface RejectionLetterScoreCardInput {
  recommendation: string;
  comment?: string | null;
  interviewerRole?: string | null;
  createdAt?: string | null;
}

export interface RejectionLetterApplicationInput {
  applicationId: string;
  currentStage: string;
  rejectionReason?: string | null;
  rejectionComment?: string | null;
  reachedStages: string[];
}

export interface GenerateRejectionLetterInput {
  candidate: RejectionLetterCandidateInput;
  job: RejectionLetterJobInput;
  application: RejectionLetterApplicationInput;
  sender?: RejectionLetterSenderInput;
  stageNotes?: RejectionLetterStageNoteInput[];
  scoreCards?: RejectionLetterScoreCardInput[];
  tone: RejectionLetterTone;
}

export interface GeneratedRejectionLetterDraft {
  subject: string;
  body: string;
  tone: RejectionLetterTone;
  usedContext: string[];
  guardrailNotes: string[];
}
