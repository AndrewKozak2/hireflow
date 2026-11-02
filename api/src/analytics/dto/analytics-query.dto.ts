import { IsNotEmpty, IsDateString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AnalyticsQueryDto {
  @ApiProperty({
    example: "2026-05-01",
    description: "Start date of the analytics range (ISO format)",
  })
  @IsNotEmpty()
  @IsDateString()
  from!: string;

  @ApiProperty({
    example: "2026-05-31",
    description: "End date of the analytics range (ISO format)",
  })
  @IsNotEmpty()
  @IsDateString()
  to!: string;
}
