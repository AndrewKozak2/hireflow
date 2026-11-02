import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ApplicationStage } from "../enums/application-stage.enum";
import { AiRecommendation } from "../enums/ai-recommendation.enum";
import { RejectionReason } from "../enums/rejection-reason.enum";

export class CreateApplicationDto {
  @ApiProperty({
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    description: "ID of the candidate",
  })
  @IsUUID()
  @IsNotEmpty()
  candidateId!: string;

  @ApiProperty({
    example: "a111b222-c333-d444-e555-f666g777h888",
    description: "ID of the job",
  })
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({
    enum: ApplicationStage,
    default: ApplicationStage.NEW,
    required: false,
  })
  @IsEnum(ApplicationStage)
  @IsOptional()
  stage?: ApplicationStage;

  @ApiProperty({
    example: "manual",
    description: "Source of the application (e.g. dou, djinni, email, manual)",
    default: "manual",
  })
  @IsString()
  @IsNotEmpty()
  source!: string;

  @ApiProperty({
    example: 85,
    description: "AI-generated score for the application",
    required: false,
  })
  @IsInt()
  @IsOptional()
  aiScore?: number;

  @ApiProperty({
    example: "Strong candidate with React experience",
    required: false,
  })
  @IsString()
  @IsOptional()
  aiSummary?: string;

  @ApiProperty({ enum: AiRecommendation, required: false })
  @IsEnum(AiRecommendation)
  @IsOptional()
  aiRecommendation?: AiRecommendation;

  @ApiProperty({ enum: RejectionReason, required: false })
  @IsEnum(RejectionReason)
  @IsOptional()
  rejectionReason?: RejectionReason;

  @ApiProperty({ example: "Salary expectations too high", required: false })
  @IsString()
  @IsOptional()
  rejectionComment?: string;

  @ApiProperty({ example: "uuid-recruiter", required: false })
  @IsUUID()
  @IsOptional()
  recruiterId?: string;
}
