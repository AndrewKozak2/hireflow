export interface ApplicationLifecycleTransition {
  from: string | null;
  to: string;
  changedAt: string;
}

export interface ApplicationLifecycleComment {
  authorRole?: string | null;
  createdAt: string;
  text: string;
}

export interface ApplicationLifecycleScore {
  label: string;
  value: string | number;
  notes?: string | null;
}

export interface AnalyzeRejectionReasonInput {
  applicationId: string;
  stageTransitions: ApplicationLifecycleTransition[];
  comments?: ApplicationLifecycleComment[];
  scores?: ApplicationLifecycleScore[];
}

export type RejectionConfidence = "low" | "medium" | "high";
export type RejectionSeverity = "low" | "medium" | "high";

export interface RejectionReasonAnalysis {
  reason: string | null;
  supportingPoints: string[];
  confidence: RejectionConfidence;
  severity: RejectionSeverity;
}
