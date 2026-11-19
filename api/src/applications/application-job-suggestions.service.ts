import { Injectable } from "@nestjs/common";
import { DataSource, In, IsNull, Not } from "typeorm";
import { Application } from "./entities/application.entity";
import { ApplicationStage } from "./enums/application-stage.enum";
import { EmailIngestionEvent } from "../email-ingest/entities/email-ingestion-event.entity";
import { Job } from "../job/entities/job.entity";
import { JobStatus } from "../job/enums/job-status.enum";

export type JobSuggestionSource = "email" | "ai";
export type JobSuggestionConfidence = "high" | "medium" | "low";

export interface JobSuggestion {
  jobId: string;
  title: string;
  /** "email": the email names this job; "ai": suggested from the CV. */
  source: JobSuggestionSource;
  confidence: JobSuggestionConfidence | null;
  reason: string | null;
}

export interface ApplicationJobSuggestions {
  applicationId: string;
  /** "ambiguous": the email fits several jobs; "none": no job named. */
  status: "ambiguous" | "none";
  appliedRole: string | null;
  options: JobSuggestion[];
}

/** The shape email ingestion stores in classificationResult.jobMatch. */
interface StoredJobMatch {
  status?: string;
  candidates?: { id?: unknown }[];
  suggestions?: { jobId?: unknown; confidence?: unknown; reason?: unknown }[];
}

const CONFIDENCE_ORDER: Record<JobSuggestionConfidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Turns what email ingestion recorded about an unassigned application (the
 * jobs the email could mean, or AI suggestions from the CV) into options a
 * recruiter can assign in one click. Only applications that still have no job
 * get suggestions, unless they are already closed (hired or rejected), and
 * only jobs that are still active are offered.
 */
@Injectable()
export class ApplicationJobSuggestionsService {
  constructor(private readonly dataSource: DataSource) {}

  async getForApplications(
    applicationIds: string[],
  ): Promise<Record<string, ApplicationJobSuggestions>> {
    const ids = [...new Set(applicationIds)].filter(Boolean);
    if (ids.length === 0) return {};

    const unassigned = await this.dataSource.getRepository(Application).find({
      // Closed applications (hired or rejected) are not offered a job.
      where: {
        id: In(ids),
        jobId: IsNull(),
        stage: Not(In([ApplicationStage.HIRED, ApplicationStage.REJECTED])),
      },
      select: { id: true },
    });
    if (unassigned.length === 0) return {};

    const events = await this.dataSource
      .getRepository(EmailIngestionEvent)
      .find({
        where: { applicationId: In(unassigned.map((app) => app.id)) },
        order: { createdAt: "DESC" },
      });

    // Latest event per application.
    const matchByApplication = new Map<
      string,
      { jobMatch: StoredJobMatch; appliedRole: string | null }
    >();
    for (const event of events) {
      if (!event.applicationId || matchByApplication.has(event.applicationId)) {
        continue;
      }
      const result = (event.classificationResult ?? {}) as Record<
        string,
        unknown
      >;
      const jobMatch = result.jobMatch;
      if (!jobMatch || typeof jobMatch !== "object") continue;
      matchByApplication.set(event.applicationId, {
        jobMatch,
        appliedRole:
          typeof result.appliedRole === "string" ? result.appliedRole : null,
      });
    }
    if (matchByApplication.size === 0) return {};

    const activeJobs = await this.dataSource.getRepository(Job).find({
      where: { status: JobStatus.ACTIVE },
      select: { id: true, title: true },
    });
    const titleById = new Map(activeJobs.map((job) => [job.id, job.title]));

    const suggestions: Record<string, ApplicationJobSuggestions> = {};
    for (const [
      applicationId,
      { jobMatch, appliedRole },
    ] of matchByApplication) {
      const options = this.buildOptions(jobMatch, titleById);
      if (options.length === 0) continue;

      suggestions[applicationId] = {
        applicationId,
        status: jobMatch.status === "ambiguous" ? "ambiguous" : "none",
        appliedRole,
        options,
      };
    }
    return suggestions;
  }

  private buildOptions(
    jobMatch: StoredJobMatch,
    titleById: Map<string, string>,
  ): JobSuggestion[] {
    const options: JobSuggestion[] = [];
    const seen = new Set<string>();

    for (const candidate of jobMatch.candidates ?? []) {
      const jobId = typeof candidate.id === "string" ? candidate.id : null;
      const title = jobId ? titleById.get(jobId) : undefined;
      if (!jobId || !title || seen.has(jobId)) continue;
      seen.add(jobId);
      options.push({
        jobId,
        title,
        source: "email",
        confidence: null,
        reason: null,
      });
    }

    const aiOptions: JobSuggestion[] = [];
    for (const suggestion of jobMatch.suggestions ?? []) {
      const jobId =
        typeof suggestion.jobId === "string" ? suggestion.jobId : null;
      const title = jobId ? titleById.get(jobId) : undefined;
      if (!jobId || !title || seen.has(jobId)) continue;
      seen.add(jobId);
      const confidence =
        suggestion.confidence === "high" ||
        suggestion.confidence === "medium" ||
        suggestion.confidence === "low"
          ? suggestion.confidence
          : null;
      aiOptions.push({
        jobId,
        title,
        source: "ai",
        confidence,
        reason:
          typeof suggestion.reason === "string" ? suggestion.reason : null,
      });
    }
    aiOptions.sort(
      (a, b) =>
        (a.confidence ? CONFIDENCE_ORDER[a.confidence] : 3) -
        (b.confidence ? CONFIDENCE_ORDER[b.confidence] : 3),
    );

    return [...options, ...aiOptions];
  }
}
