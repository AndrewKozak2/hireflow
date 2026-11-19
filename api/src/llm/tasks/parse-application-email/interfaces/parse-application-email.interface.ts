export interface ApplicationEmailAttachmentMetadata {
  filename: string;
  contentType?: string | null;
  sizeBytes?: number | null;
}

export interface ParseApplicationEmailInput {
  subject: string;
  body: string;
  attachments?: ApplicationEmailAttachmentMetadata[];
  /** Titles of the currently open jobs, so the model can say which one is meant. */
  openJobTitles?: string[];
}

export interface ParsedApplicationEmailCandidateInfo {
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  appliedRole: string | null;
  location: string | null;
  links: string[];
  summary: string | null;
  isApplication: boolean | null;
  /**
   * Open job titles, copied exactly from openJobTitles, that the email says the
   * candidate applies for. Empty when no open job is named; several when the
   * wording fits more than one or the candidate names more than one.
   */
  appliedJobTitles: string[];
}
