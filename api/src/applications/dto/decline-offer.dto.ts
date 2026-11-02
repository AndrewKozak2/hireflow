import { IsEnum, IsOptional, IsString, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RejectionReason } from "../enums/rejection-reason.enum";

export class DeclineOfferDto {
  @ApiProperty({
    enum: RejectionReason,
    description: "Reason category for declining the offer",
    example: RejectionReason.SALARY_EXPECTATIONS,
  })
  @IsEnum(RejectionReason)
  reason!: RejectionReason;

  @ApiProperty({
    description: "Optional note for the decline",
    example: "Candidate requested higher salary than offered",
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    description: "Whether to send a rejection email",
    default: false,
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;
}
