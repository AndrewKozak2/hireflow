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

    return [
      "Extract candidate information from this raw application email.",
      "Return JSON with exactly these keys:",
      "isApplication, candidateName, email, phone, appliedRole, location, links, summary.",
      "isApplication should be true if the email contains a resume/CV file in the attachments metadata OR if there is a direct download link to a CV/resume in the body. If it is just a general inquiry or spam, set it to false.",
      "Use null for missing scalar fields and [] when no links are found.",
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
