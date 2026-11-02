import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType } from "../enums/notification-type.enum";

export class NotificationResponseDto {
  @ApiProperty({ example: "uuid-v4" })
  id!: string;

  @ApiProperty({ example: "New Job Application" })
  title!: string;

  @ApiProperty({ example: "Someone applied for your job" })
  message!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ example: false })
  is_read!: boolean;

  @ApiPropertyOptional({ example: { jobId: "123" } })
  metadata?: Record<string, any>;

  @ApiProperty({ example: "2023-10-27T10:00:00Z" })
  created_at!: Date;
}
