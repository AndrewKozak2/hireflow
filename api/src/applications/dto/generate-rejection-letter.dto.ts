import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";
import { RejectionReason } from "../enums/rejection-reason.enum";
import { RejectionLetterTone } from "../../llm/tasks/generate-rejection-letter/interfaces/generate-rejection-letter.interface";

const REJECTION_LETTER_TONES = ["neutral", "warm", "concise"] as const;

export class GenerateRejectionLetterDto {
  @ApiPropertyOptional({
    enum: REJECTION_LETTER_TONES,
    default: "neutral",
    description: "Tone to use for the generated rejection letter draft",
  })
  @IsOptional()
  @IsIn(REJECTION_LETTER_TONES)
  tone?: RejectionLetterTone;

  @ApiProperty({
    enum: RejectionReason,
    description:
      "Required rejection reason category from the UI. Used together with application history, comments, and score cards.",
  })
  @IsEnum(RejectionReason)
  rejectionReason!: RejectionReason;

  @ApiPropertyOptional({
    description:
      "Optional recruiter or hiring manager note to consider when generating the draft. It is treated as internal context and must not be quoted directly.",
  })
  @IsOptional()
  @IsString()
  rejectionComment?: string;
}
