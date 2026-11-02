import { LlmTask } from "../../interfaces/llm.interface";
import { aiScreeningSchema } from "./ai-screening.schema";
import {
  AiScreeningInput,
  GeneratedAiScreening,
} from "./interfaces/ai-screening.interface";

export const aiScreeningTask: LlmTask<AiScreeningInput, GeneratedAiScreening> =
  {
    name: "ai-screening",
    tier: "heavy",
    temperature: 0.1,
    maxTokens: 700,
    outputSchema: aiScreeningSchema,
    buildPrompt(input) {
      const requirementsList = input.jobRequirements
        .map((r) => `- ${r}`)
        .join("\n");

      return [
        "You are an expert technical recruiter performing an initial CV screening.",
        "Analyze the candidate's resume against the job requirements and output a strict JSON.",
        "",
        "=== EXPECTED OUTPUT FORMAT ===",
        "{",
        '  "matchPercentage": <number 0-100>,',
        '  "recommendation": "<proceed | review | reject>",',
        '  "summary": "<string, max 3 sentences explaining the decision>",',
        '  "extractedSkills": ["<skill1>", "<skill2>"]',
        "}",
        "",
        "=== RULES ===",
        "- matchPercentage: Calculate how well the resume matches the requirements (e.g., 78).",
        "- recommendation: 'proceed' if match > 70%, 'review' if 50-70%, 'reject' if < 50%.",
        "- summary: Short, punchy overview (e.g., 'Senior DevOps with deep Kubernetes...').",
        "- extractedSkills: Extract ALL relevant technical hard skills found in the resume.",
        "",
        "=== JOB POSITION ===",
        `Title: ${input.jobTitle}`,
        "Requirements:",
        requirementsList,
        "",
        "=== CANDIDATE RESUME ===",
        `Experience: ${input.parsedCv.experienceSummary || "None"}`,
        `Skills: ${input.parsedCv.skills?.join(", ") || "None"}`,
        `Education: ${input.parsedCv.education?.join("; ") || "None"}`,
        `Summary: ${input.parsedCv.summary || "None"}`,
      ].join("\n");
    },
  };
