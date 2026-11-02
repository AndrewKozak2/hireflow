import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  Min,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { ApplicationStage } from "../enums/application-stage.enum";

export class ApplicationQueryDto {
  @ApiProperty({
    enum: ApplicationStage,
    description: "Filter by application stage (accepts array or single value)",
    required: false,
    isArray: true,
  })
  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }): ApplicationStage[] | undefined => {
      if (!value) return undefined;
      return (Array.isArray(value) ? value : [value]) as ApplicationStage[];
    },
  )
  @IsEnum(ApplicationStage, { each: true })
  stage?: ApplicationStage | ApplicationStage[];

  @ApiProperty({
    type: [String],
    description:
      "Filter by application source (accepts array or single value, e.g. dou, djinni)",
    required: false,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): string[] | undefined => {
    if (!value) return undefined;
    return (Array.isArray(value) ? value : [value]).map(String);
  })
  @IsString({ each: true })
  source?: string | string[];

  @ApiProperty({
    description: "Search by candidate name or job title",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "ID vacancy to filter applications",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({
    description: "ID candidate to filter applications",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  candidateId?: string;

  @ApiProperty({
    default: 1,
    minimum: 1,
    description: "Page number for pagination",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    default: 25,
    minimum: 1,
    description: "Number of items per page",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 25;
}
