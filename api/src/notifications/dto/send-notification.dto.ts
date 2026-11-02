import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType } from "../enums/notification-type.enum";

export class SendNotificationDto {
  @ApiProperty({ example: "uuid-v4" })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ example: "user@example.com" })
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiProperty({ example: "New Job Application" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: "Someone applied for your job" })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: "<h1>Hello</h1><p>World</p>" })
  @IsString()
  @IsOptional()
  htmlContent?: string;

  @ApiProperty({ enum: NotificationType, default: NotificationType.INFO })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ example: { jobId: "123" } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: "https://app.hireflow.com/applications/123" })
  @IsString()
  @IsOptional()
  ctaUrl?: string;

  @ApiPropertyOptional({ example: "View Application" })
  @IsString()
  @IsOptional()
  ctaText?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  saveToDb?: boolean;
}
