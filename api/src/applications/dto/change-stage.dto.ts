import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ApplicationStage } from "../enums/application-stage.enum";
import { RejectionReason } from "../enums/rejection-reason.enum";

export class ChangeStageDto {
  @ApiProperty({
    enum: ApplicationStage,
    description: "New stage for the application",
    example: ApplicationStage.SCREENING,
  })
  @IsEnum(ApplicationStage)
  stage!: ApplicationStage;

  @ApiProperty({
    enum: RejectionReason,
    description: "Reason for rejection",
    required: false,
  })
  @IsOptional()
  @IsEnum(RejectionReason)
  rejectionReason?: RejectionReason;

  @ApiProperty({ example: "Did not pass technical test", required: false })
  @IsOptional()
  @IsString()
  rejectionComment?: string;

  @ApiProperty({
    example: "Your application for Senior Developer",
    required: false,
  })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiProperty({
    example: "We appreciate your time and wish you the best.",
    required: false,
  })
  @IsOptional()
  @IsString()
  emailMessage?: string;

  @ApiProperty({
    example: true,
    required: false,
    description: "Send rejection email to the candidate",
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
