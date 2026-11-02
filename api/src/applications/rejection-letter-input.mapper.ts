import { Application } from "./entities/application.entity";
import { ApplicationEvent } from "./entities/application-event.entity";
import { ScoreCard } from "./entities/score-card.entity";
import { ApplicationEventType } from "./enums/application-event-type.enum";
import { ApplicationStage } from "./enums/application-stage.enum";
import {
  GenerateRejectionLetterInput,
  RejectionLetterScoreCardInput,
  RejectionLetterStageNoteInput,
  RejectionLetterTone,
} from "../llm/tasks/generate-rejection-letter/interfaces/generate-rejection-letter.interface";

interface BuildRejectionLetterInputOptions {
  tone?: RejectionLetterTone;
  rejectionReason?: string | null;
  rejectionComment?: string | null;
  senderName?: string | null;
  senderRole?: string | null;
  companyName?: string | null;
}

interface StageTransitionContext {
  from: string | null;
  to: string;
  changedAt: Date;
  actorRole: string | null;
}

const NOTE_TYPE_BY_STAGE: Record<
  string,
  RejectionLetterStageNoteInput["noteType"]
> = {
  [ApplicationStage.SCREENING]: "screening",
  [ApplicationStage.PRE_INTERVIEW]: "pre_interview",
  [ApplicationStage.TECHNICAL_INTERVIEW]: "technical_interview",
  [ApplicationStage.OFFER]: "offer",
};

export function buildRejectionLetterInput(
  application: Application,
  scoreCards: ScoreCard[] = [],
  options: BuildRejectionLetterInputOptions = {},
): GenerateRejectionLetterInput {
  const stageTransitions = getStageTransitions(application.events ?? []);
  const rejectionReason =
    options.rejectionReason ?? application.rejectionReason ?? null;
  const rejectionComment =
    options.rejectionComment ?? application.rejectionComment ?? null;

  return {
    candidate: {
      name: getCandidateName(application),
      email: application.candidate?.email ?? null,
    },
    job: {
      title: application.job?.title ?? null,
      department: null,
    },
    application: {
      applicationId: application.id,
      currentStage: application.stage,
      rejectionReason,
      rejectionComment,
      reachedStages: getReachedStages(application.stage, stageTransitions),
    },
    sender: {
      name: options.senderName ?? null,
      role: options.senderRole ?? null,
      companyName: options.companyName ?? "HireFlow",
    },
    stageNotes: getStageNotes(application, stageTransitions, rejectionComment),
    scoreCards: getScoreCards(scoreCards),
    tone: options.tone ?? "neutral",
  };
}

function getCandidateName(application: Application): string | null {
  const name = [
    application.candidate?.firstName,
    application.candidate?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || null;
}

function getStageTransitions(
  events: ApplicationEvent[],
): StageTransitionContext[] {
  return events
    .filter((event) => event.type === ApplicationEventType.STAGE_CHANGED)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((event) => {
      const payload = getRecordPayload(event.payload);
      const to = readString(payload, "to");

      if (!to) {
        return null;
      }

      return {
        from: readString(payload, "from"),
        to,
        changedAt: event.createdAt,
        actorRole: event.actor?.role ? String(event.actor.role) : null,
      };
    })
    .filter((transition): transition is StageTransitionContext => {
      return transition !== null;
    });
}

function getReachedStages(
  currentStage: ApplicationStage,
  stageTransitions: StageTransitionContext[],
): string[] {
  const stages = new Set<string>([ApplicationStage.NEW]);

  for (const transition of stageTransitions) {
    if (transition.from) {
      stages.add(transition.from);
    }
    stages.add(transition.to);
  }

  stages.add(currentStage);
  return [...stages];
}

function getStageNotes(
  application: Application,
  stageTransitions: StageTransitionContext[],
  rejectionComment?: string | null,
): RejectionLetterStageNoteInput[] {
  const notes: RejectionLetterStageNoteInput[] = [];

  const aiScreeningText = [
    application.aiSummary,
    application.aiRecommendation
      ? `AI recommendation: ${application.aiRecommendation}`
      : null,
    application.aiScore !== null && application.aiScore !== undefined
      ? `AI score: ${application.aiScore}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (aiScreeningText) {
    notes.push({
      stage: ApplicationStage.SCREENING,
      noteType: "screening",
      text: aiScreeningText,
      createdAt: toIsoString(application.updatedAt),
      authorRole: "system",
    });
  }

  for (const transition of stageTransitions) {
    notes.push({
      stage: transition.to,
      noteType: "general",
      text: transition.from
        ? `Stage changed from ${transition.from} to ${transition.to}.`
        : `Stage changed to ${transition.to}.`,
      createdAt: toIsoString(transition.changedAt),
      authorRole: transition.actorRole,
    });
  }

  if (rejectionComment) {
    notes.push({
      stage: application.stage,
      noteType: "rejection",
      text: rejectionComment,
      createdAt: null,
      authorRole: null,
    });
  }

  for (const comment of application.comments ?? []) {
    const stage = inferStageAt(
      comment.createdAt,
      stageTransitions,
      application.stage,
    );

    notes.push({
      stage,
      noteType: getNoteTypeForStage(stage),
      text: comment.content,
      createdAt: toIsoString(comment.createdAt),
      authorRole: comment.author?.role ?? null,
    });
  }

  return notes.sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    return aTime - bTime;
  });
}

function getScoreCards(
  scoreCards: ScoreCard[],
): RejectionLetterScoreCardInput[] {
  return scoreCards.map((scoreCard) => ({
    recommendation: scoreCard.recommendation,
    comment: scoreCard.comment ?? null,
    interviewerRole: scoreCard.interviewer?.role ?? null,
    createdAt: toIsoString(scoreCard.createdAt),
  }));
}

function inferStageAt(
  createdAt: Date,
  stageTransitions: StageTransitionContext[],
  fallbackStage: ApplicationStage,
): string {
  let currentStage: string = ApplicationStage.NEW;
  const createdAtMs = createdAt.getTime();

  for (const transition of stageTransitions) {
    if (transition.changedAt.getTime() <= createdAtMs) {
      currentStage = transition.to;
    }
  }

  return currentStage || fallbackStage;
}

function getNoteTypeForStage(
  stage: string,
): RejectionLetterStageNoteInput["noteType"] {
  return NOTE_TYPE_BY_STAGE[stage] ?? "general";
}

function getRecordPayload(payload: unknown): Record<string, unknown> | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return null;
  }

  return payload as Record<string, unknown>;
}

function readString(
  payload: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = payload?.[key];
  return typeof value === "string" ? value : null;
}

function toIsoString(value?: Date | null): string | null {
  return value ? value.toISOString() : null;
}
