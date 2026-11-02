import { IsOptional, IsEnum, IsUUID } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { JobStatus } from "../enums/job-status.enum";

export class GetJobsQueryDto {
  @ApiPropertyOptional({
    description: "Filter jobs by status",
    enum: JobStatus,
    isArray: true,
    example: [JobStatus.ACTIVE],
  })
  @IsOptional()
  @IsEnum(JobStatus, { each: true })
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === "string") return [value];
    return undefined;
  })
  status?: JobStatus[];

  @ApiPropertyOptional({
    description: "Filter jobs by recruiter ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID()
  recruiter_id?: string;
}
