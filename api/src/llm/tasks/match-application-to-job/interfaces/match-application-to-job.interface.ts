import { Job } from "../../../../job/entities/job.entity";

export interface MatchApplicationToJobInput {
  candidate: {
    summary?: string | null;
  };
  jobs: Pick<
    Job,
    "id" | "title" | "description" | "requirements" | "niceToHave"
  >[];
}

export interface MatchedJob {
  jobId: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export type MatchApplicationToJobOutput = MatchedJob[];
