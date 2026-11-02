export interface ApplicationEmailAttachmentMetadata {
  filename: string;
  contentType?: string | null;
  sizeBytes?: number | null;
}

export interface ParseApplicationEmailInput {
  subject: string;
  body: string;
  attachments?: ApplicationEmailAttachmentMetadata[];
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
}
