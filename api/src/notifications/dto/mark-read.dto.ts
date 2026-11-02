import { IsArray, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class MarkReadDto {
  @ApiProperty({
    example: ["uuid-1", "uuid-2"],
    description: "Array of notification IDs to mark as read",
  })
  @IsArray()
  @IsUUID("all", { each: true })
  notificationIds!: string[];
}
