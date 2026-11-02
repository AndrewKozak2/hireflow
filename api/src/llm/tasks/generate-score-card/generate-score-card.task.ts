import { LlmTask } from "../../interfaces/llm.interface";
import { generateScoreCardSchema } from "./generate-score-card.schema";
import {
  GeneratedScoreCard,
  GenerateScoreCardInput,
} from "./interfaces/generate-score-card.interface";

export const generateScoreCardTask: LlmTask<
  GenerateScoreCardInput,
  GeneratedScoreCard
> = {
  name: "generate-score-card",
  tier: "heavy",
  temperature: 0.2,
  maxTokens: 1500,
  outputSchema: generateScoreCardSchema,
  buildPrompt(input) {
    const requirementsList = input.jobRequirements
      .map((r) => `- ${r}`)
      .join("\n");
    const notesList = input.interviewNotes
      .map((note) => `[Role: ${note.interviewerRole}] ${note.content}`)
      .join("\n\n---\n\n");

    return [
      "Extract and evaluate candidate scorecard details based on their resume and interview notes compared to the job requirements.",
      "",
      "Return valid JSON matching the exact structure shown below. Do not add any markdown, comments, or extra text outside the JSON.",
      "",
      "=== EXPECTED OUTPUT FORMAT ===",
      "{",
      '  "technicalSkillsScore": <number 1-5>,',
      '  "problemSolvingScore": <number 1-5>,',
      '  "communicationScore": <number 1-5>,',
      '  "teamFitScore": <number 1-5>,',
      '  "recommendation": "<proceed | maybe | reject>",',
      '  "summaryComment": "<string summary>"',
      "}",
      "",
      "=== EVALUATION RULES ===",
      "You must evaluate the candidate on these 4 specific criteria:",
      "1. Technical Skills: tech stack, tools, architectural decisions.",
      "2. Problem Solving: ability to resolve bugs and analytical thinking.",
      "3. Communication: communication clarity and language proficiency.",
      "4. Team Fit: team collaboration and overall motivation.",
      "5. Base your scores STRICTLY on the provided interview notes. If a specific criteria was not mentioned in the notes, give it a neutral score (e.g., 3)or state in the summary that it wasn't assessed.",
      "",
      "Scoring Logic:",
      "- Scores are from 1 (lowest) to 5 (highest).",
      "- Recommendation rules: 'proceed' if average criteria score is >= 3.5; 'maybe' if between 2.5 and 3.4; 'reject' if below 2.5 or if critical red flags exist.",
      "=== JOB POSITION ===",
      `Title: ${input.jobTitle}`,
      "Requirements:",
      requirementsList,
      "",
      "=== CANDIDATE RESUME ===",
      input.candidateResume,
      "",
      "=== INTERVIEW NOTES ===",
      notesList,
    ].join("\n");
  },
};
