import { IsOptional, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ClearAllDto {
  @ApiPropertyOptional({
    example: "2023-10-01T00:00:00Z",
    description: "Date before which notifications should be cleared",
  })
  @IsOptional()
  @IsDateString()
  clearedBefore?: string;
}
