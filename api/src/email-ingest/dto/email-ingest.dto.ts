import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class EmailIngestAttachmentDto {
  @ApiProperty({
    description: "The name of the attachment",
    example: "resume.pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "The filename of the attachment",
    example: "resume.pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiProperty({
    description: "The original filename of the attachment",
    example: "resume.pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  originalFilename?: string;

  @ApiProperty({
    description: "The content type of the attachment",
    example: "application/pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiProperty({
    description: "The MIME type of the attachment",
    example: "application/pdf",
    required: false,
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiProperty({
    description: "The size of the attachment in bytes",
    example: 67000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  size?: number;

  @ApiProperty({
    description: "Base64-encoded attachment bytes",
    example: "SGVsbG8gV29ybGQ=",
    required: false,
  })
  @IsOptional()
  @IsString()
  contentBase64?: string;

  @ApiProperty({
    description: "Legacy base64-encoded attachment bytes",
    example: "SGVsbG8gV29ybGQ=",
    required: false,
  })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiProperty({
    description: "Whether the attachment is metadata only",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isMetadataOnly?: boolean;
}

export class EmailIngestItemDto {
  @ApiProperty({
    description: "The unique ID of the Gmail message",
    example: "gmail-msg-001",
  })
  @IsString()
  @IsNotEmpty()
  gmailMessageId!: string;

  @ApiProperty({
    description: "The sender of the email",
    example: "LinkedIn Jobs <jobs-listings@linkedin.com>",
  })
  @IsString()
  @IsNotEmpty()
  sender!: string;

  @ApiProperty({
    description: "The Gmail thread ID",
    example: "thread-001",
    required: false,
  })
  @IsOptional()
  @IsString()
  threadId?: string;

  @ApiProperty({
    description: "The email address that forwarded the message",
    example: "applications@hireflow.dev",
    required: false,
  })
  @IsOptional()
  @IsString()
  forwardedBy?: string;

  @ApiProperty({
    description: "The timestamp when the email was received",
    example: "2026-05-19T11:00:00.000Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @ApiProperty({
    description: "The subject of the email",
    example: "New application",
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: "The body content of the email",
    example: "Candidate applied from LinkedIn",
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({
    description: "List of links extracted from the email body",
    type: [String],
    example: ["https://www.linkedin.com/jobs/view/123"],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  links?: string[];

  @ApiProperty({
    description: "List of email attachments",
    type: [EmailIngestAttachmentDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailIngestAttachmentDto)
  attachments?: EmailIngestAttachmentDto[];
}

export class EmailIngestBatchDto {
  @ApiProperty({
    description: "List of email messages to ingest",
    type: [EmailIngestItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailIngestItemDto)
  items!: EmailIngestItemDto[];
}

export class EmailIngestResultDto {
  @ApiProperty({
    description: "The unique ID of the Gmail message",
    example: "gmail-msg-001",
  })
  gmailMessageId!: string;

  @ApiProperty({
    description: "The ingestion status of the message",
    enum: ["received", "duplicate"],
    example: "received",
  })
  status!: "received" | "duplicate";

  @ApiProperty({
    description: "The ID of the created ingestion event",
    example: "7f1f6b2e-8ee5-4c56-a0cb-5763838f6a41",
    required: false,
  })
  ingestionEventId?: string;

  @ApiProperty({
    description: "The ID of the created application, if any",
    example: "7f1f6b2e-8ee5-4c56-a0cb-5763838f6a41",
    required: false,
  })
  applicationId?: string | null;
}

export class EmailIngestResponseDto {
  @ApiProperty({
    description: "List of ingestion results for each item in the batch",
    type: [EmailIngestResultDto],
  })
  results!: EmailIngestResultDto[];
}
