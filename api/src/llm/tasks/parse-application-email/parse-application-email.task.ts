import { LlmTask } from "../../interfaces/llm.interface";
import { parseApplicationEmailSchema } from "./parse-application-email.schema";
import {
  ParsedApplicationEmailCandidateInfo,
  ParseApplicationEmailInput,
} from "./interfaces/parse-application-email.interface";

export const parseApplicationEmailTask: LlmTask<
  ParseApplicationEmailInput,
  ParsedApplicationEmailCandidateInfo
> = {
  name: "parse-application-email",
  tier: "light",
  temperature: 0,
  maxTokens: 900,
  outputSchema: parseApplicationEmailSchema,
  buildPrompt(input) {
    const attachments = input.attachments?.length
      ? input.attachments
          .map((attachment) => {
            return `- ${attachment.filename} (${attachment.contentType ?? "unknown type"}, ${attachment.sizeBytes ?? "unknown size"} bytes)`;
          })
          .join("\n")
      : "No attachments metadata provided.";

    const openJobs = input.openJobTitles?.length
      ? input.openJobTitles.map((title) => `- ${title}`).join("\n")
      : "No open jobs.";

    return [
      "Extract candidate information from this raw application email.",
      "Return JSON with exactly these keys:",
      "isApplication, candidateName, email, phone, appliedRole, location, links, summary, appliedJobTitles.",
      "isApplication should be true if the email contains a resume/CV file in the attachments metadata OR if there is a direct download link to a CV/resume in the body. If it is just a general inquiry or spam, set it to false.",
      "Use null for missing scalar fields and [] when no links are found.",
      "",
      "appliedJobTitles: which of the open jobs listed below the email says the candidate is applying for.",
      "- Copy titles EXACTLY as written in the list. Never return a title that is not in the list.",
      '- Count the role named in the subject, the body, a job-board notification or a vacancy link, in any language, transliteration, abbreviation or with typos (e.g. "Фронтенд девелопер", "джун React", "front-end dev").',
      "- If the named role fits exactly one open job, return that one title.",
      '- If the named role is a direct translation or spelling of one open job title (e.g. "React-розробник" for "React Developer"), return only that title, even if other jobs use the same technology or seniority.',
      '- If the named role fits several open jobs about equally (e.g. "frontend developer" while both a junior and a middle frontend job are open), return all of them. Do not pick one.',
      "- If the candidate explicitly applies for several jobs, return each of them.",
      "- Return [] if no role is named, the email is sent for future openings, or the named role matches none of the open jobs.",
      "- Decide only from what the email says the candidate applies for. Do not infer a job from the candidate's skills or experience.",
      "",
      "Open jobs:",
      openJobs,
      "",
      `Subject: ${input.subject}`,
      "",
      "Body:",
      input.body,
      "",
      "Attachments metadata:",
      attachments,
    ].join("\n");
  },
};
