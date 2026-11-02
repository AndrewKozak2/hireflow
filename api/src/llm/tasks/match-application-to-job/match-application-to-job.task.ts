import { Logger } from "@nestjs/common";
import { LlmTask } from "../../interfaces/llm.interface";
import {
  MatchApplicationToJobInput,
  MatchApplicationToJobOutput,
} from "./interfaces/match-application-to-job.interface";
import { matchApplicationToJobSchema } from "./match-application-to-job.schema";

const logger = new Logger("match-application-to-job");

export const matchApplicationToJobTask: LlmTask<
  MatchApplicationToJobInput,
  MatchApplicationToJobOutput
> = {
  name: "match-application-to-job",
  tier: "light",
  temperature: 0,
  maxTokens: 900,
  systemPrompt: `
      You are an expert AI recruitment matching system.

      Your task is to match an incoming candidate application to one or more open job vacancies based ONLY on the provided candidate application text and job descriptions.

      You must be strict, deterministic, and conservative in matching.

      IMPORTANT RULES:
      - Use ONLY the provided candidate text and job descriptions
      - If the candidate explicitly applied for a specific role (e.g. "APPLIED EXPLICITLY FOR ROLE: <role>"), THIS IS THE STRONGEST SIGNAL. You MUST prioritize matching the candidate to the job with that exact or highly similar title!
      - Do NOT assume missing information
      - Do NOT hallucinate skills or experience
      - If information is insufficient, lower confidence instead of guessing
      - Always prefer false negatives over false positives

      CONFIDENCE SCALE:
      - high(90%+): strong evidence of fit (skills + experience clearly match requirements)
      - medium(50-90%): partial match, some evidence missing or indirect
      - low(30-50%): weak but plausible relevance
      - below low: DO NOT include

      FALLBACK RULES:
      - If no job reaches at least low confidence → return empty array
      - If multiple jobs have similar confidence → include all, sorted by confidence
      - Do not force a match if uncertain

      OUTPUT RULES:
      - Return ONLY valid JSON array
      - Each item must have exactly these keys: jobId, confidence, reason
      - jobId must be copied exactly from one of the provided "Job ID" values
      - confidence must be one of: high, medium, low
      - If you cannot identify a provided Job ID for a match, omit that match
      - If there are no valid matches, return []
      - No explanations outside JSON
      - No markdown
      - Example output: [{"jobId":"00000000-0000-0000-0000-000000000000","confidence":"high","reason":"Candidate has strong TypeScript and NestJS experience matching the role requirements."}]

      SORTING:
      - Sort results by confidence (high → medium → low)

      Return matched jobs now.
  `,
  outputSchema: matchApplicationToJobSchema,
  buildPrompt(input) {
    const jobDescriptions = input.jobs
      .map(
        (job) =>
          `Job ID: ${job.id}\nTitle: ${job.title}\nDescription: ${job.description ?? "Not provided"}\nRequirements: ${job.requirements ?? "Not provided"}\nNice to have: ${job.niceToHave ?? "Not provided"}`,
      )
      .join("\n---\n");
    logger.log(
      `Candidate Description:\n${input.candidate.summary ?? "Not provided"}\nJobs:\n${jobDescriptions}`,
    );
    return `Candidate Description:\n${input.candidate.summary ?? "Not provided"}\nJobs:\n${jobDescriptions}`;
  },
};
