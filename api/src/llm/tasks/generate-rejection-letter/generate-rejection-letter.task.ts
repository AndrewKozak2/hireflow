import { LlmTask } from "../../interfaces/llm.interface";
import { generateRejectionLetterSchema } from "./generate-rejection-letter.schema";
import {
  GeneratedRejectionLetterDraft,
  GenerateRejectionLetterInput,
} from "./interfaces/generate-rejection-letter.interface";

const SYSTEM_PROMPT = [
  "You write candidate-facing rejection letter drafts for a recruiting team.",
  "Return only valid JSON matching the requested schema.",
  "Never send the email. Produce a draft for recruiter or hiring manager review.",
  "Protect the company and candidate: keep feedback professional, general, factual, and low-risk.",
  "Do not expose internal notes, score card details, interviewer names, sensitive comments, protected-class references, or legally risky specifics.",
  "Do not invent facts, future opportunities, compensation details, or promises.",
  "Never use placeholders such as [Recruiter Name], [Hiring Manager Name], [Company Name], or TODO text.",
  'The body must end exactly with: "Best regards,\\nThe InterCode Team".',
].join(" ");

export const GENERATE_REJECTION_LETTER_PROMPT_VERSION = "v1";

export const generateRejectionLetterTask: LlmTask<
  GenerateRejectionLetterInput,
  GeneratedRejectionLetterDraft
> = {
  name: "generate-rejection-letter",
  tier: "light",
  temperature: 0,
  maxTokens: 1000,
  systemPrompt: SYSTEM_PROMPT,
  outputSchema: generateRejectionLetterSchema,
  buildPrompt(input) {
    return [
      "Generate a candidate-facing rejection letter draft.",
      "",
      "Output JSON with exactly these keys:",
      "subject, body, tone, usedContext, guardrailNotes.",
      "",
      "Rules:",
      "- The body must be ready for recruiter/HM review and editing before sending.",
      "- Address the candidate by first name if a name is available; otherwise use a generic greeting.",
      "- Mention the role title when available.",
      "- Thank the candidate for their time and interest.",
      "- For screening-only cases, thank the candidate for their application, interest, time, or effort. Do not say they completed a screening process or interview process unless the input clearly shows they actively participated in that process.",
      "- Mention interviews, interview process, or conversations only when the input includes an interview stage, interview notes, score card, or other clear interview evidence.",
      "- State that the team will not move forward at this time.",
      "- Keep the reason appropriately general, even when detailed internal notes are present.",
      "- Do not frame the rejection as a deficiency, failure, or weakness of the candidate. Frame it as a role-fit decision or current hiring need.",
      "- When the reason is technical, skills-related, culture-fit, score-card-related, or interview-related, do not say the candidate lacks skills, failed an evaluation, is not qualified, has weak experience, or did not meet expectations.",
      "- Prefer safe general wording such as 'this role is not the right match at this time'.",
      "- Never include direct negative judgments about the candidate's abilities, personality, communication style, seniority, culture fit, or interview performance.",
      "- Do not mention the candidate's background in the email body.",
      "- Do not mention the candidate's profile in the email body.",
      "- Do not quote internal notes or score card comments.",
      "- Do not repeat or paraphrase personal notes, recruiter notes, hiring manager notes, stage notes, or score card comments too directly. Treat them as internal context only and convert them into safe, general role-fit wording.",
      "- Do not mention the candidate's career stage, seniority level, expertise level, or what they 'bring to the table'.",
      "- Do not suggest specific future roles, senior-level roles, infrastructure roles, or any particular future opportunity. Do not say the company would reconnect later.",
      "- Avoid phrases like 'we were impressed', 'what you bring to the table', 'career stage', 'experience level', 'senior-level opportunity', 'future senior role', or 'reconnect'.",
      "- For overqualified or scope-mismatch reasons, use only general role-fit wording. Do not say the candidate is overqualified, too senior, too experienced, or better suited for a different level.",
      "- For position-closed reasons, it is safe to mention that the position has been closed or is no longer active. Do not add reassurance about the candidate's profile or personal fit.",
      "- Do not mention protected attributes, personality judgments, culture-fit negatives, age, health, family status, nationality, gender, race, religion, disability, or other sensitive categories.",
      "- Do not mention other candidates or compare the candidate to other applicants.",
      "- Never use phrases like 'another candidate', 'other candidates', 'other applicants', 'better suited', 'more suitable', 'more closely aligned than you', or any comparison against other applicants.",
      "- Do not claim comparative ranking or compare the candidate to other applicants.",
      "- Do not fabricate feedback, process steps, or future openings.",
      "- If sender.companyName is available, you may use it as the company name; otherwise use InterCode Team.",
      '- The body must end exactly with: "Best regards,\\nInterCode Team".',
      "- Do not sign with recruiter name, hiring manager name, interviewer name, or any individual person's name.",
      "- Never include bracketed placeholders or unresolved template variables.",
      "- If input context is minimal, produce a brief neutral rejection without specific feedback.",
      "- Do not include usedContext or guardrailNotes inside the email body.",
      "- usedContext should summarize which safe source categories influenced the draft, not reveal sensitive details.",
      "- guardrailNotes should list any redactions, ignored risky details, or limitations for reviewer awareness.",
      "",
      "Tone behavior:",
      "- neutral: Use a balanced professional style. Write 3 short paragraphs plus sign-off. Keep appreciation polite but not emotional. Include one general reason sentence when safe context exists.",
      "- warm: Use a softer, more empathetic, and human style. Write 3 or 4 short paragraphs plus sign-off. Focus on appreciation and the specific needs of the role, not on the candidate's shortcomings.",
      "- For warm tone, explain the decision as a role-fit decision using phrases like 'this role is not the right match at this time'. Avoid candidate-deficit wording like 'your current skill set', 'qualifications demonstrated', 'not qualified', or 'did not meet the bar'.",
      "- concise: Use the shortest safe version. Write 2 short paragraphs plus sign-off. Maximum 90 words in the body. Do not use phrases like 'we were impressed', 'careful consideration', or long encouragement. Include only one brief general reason sentence if needed.",
      "- The selected tone must materially change the wording and length. Do not return the same structure for neutral and concise.",
      "",
      "Input context:",
      JSON.stringify(input, null, 2),
    ].join("\n");
  },
};
