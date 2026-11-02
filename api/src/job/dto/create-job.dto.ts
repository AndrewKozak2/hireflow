import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { JobStatus } from "../enums/job-status.enum";
import { EmploymentType } from "../../hiring-request/enums/employment-type.enum";
import { LocationType } from "../../hiring-request/enums/location-type.enum";
import { Department } from "../../hiring-request/enums/department.enum";
import { ExpertiseLevel } from "../../hiring-request/enums/expertise-level.enum";
import { EnglishLevel } from "../../hiring-request/enums/english-level.enum";
import { Currency } from "../../hiring-request/enums/currency.enum";
import { Priority } from "../../hiring-request/enums/priority.enum";

export class CreateJobDto {
  @ApiProperty({
    type: String,
    example: "Senior Frontend Engineer",
    description: "The title of the job",
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    type: String,
    example: "We are looking for a senior frontend engineer...",
    description: "The job description",
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
    description: "The type of employment (e.g., full-time, part-time).",
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    enum: LocationType,
    example: LocationType.REMOTE,
    description: "The work location type (e.g., remote, on-site).",
  })
  @IsOptional()
  @IsEnum(LocationType)
  location?: LocationType;

  @ApiPropertyOptional({
    type: String,
    example: "Strong experience with React and TypeScript.",
    description: "The key requirements for the job.",
  })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({
    type: String,
    example: "Experience with Next.js is a plus.",
    description: "Skills or experience that are nice to have but not required.",
  })
  @IsOptional()
  @IsString()
  niceToHave?: string;

  @ApiProperty({
    type: String,
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The ID of the hiring manager",
  })
  @IsUUID()
  hiringManagerId!: string;

  @ApiPropertyOptional({
    type: String,
    example: "uuid-v4-hiring-request-id",
    description: "The ID of the hiring request this job is created from",
  })
  @IsOptional()
  @IsUUID()
  hiringRequestId?: string;

  @ApiPropertyOptional({
    enum: JobStatus,
    example: JobStatus.DRAFT,
    description: "The current status of the job posting.",
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({
    enum: Department,
    example: Department.ENGINEERING,
    description: "The department the job belongs to.",
  })
  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @ApiPropertyOptional({
    type: Number,
    example: 2,
    description: "The number of positions to fill for this job.",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @ApiPropertyOptional({
    enum: ExpertiseLevel,
    example: ExpertiseLevel.L3,
    description: "The required level of expertise for the role.",
  })
  @IsOptional()
  @IsEnum(ExpertiseLevel)
  expertise_level?: ExpertiseLevel;

  @ApiPropertyOptional({
    enum: EnglishLevel,
    example: EnglishLevel.B2,
    description: "The required English proficiency level.",
  })
  @IsOptional()
  @IsEnum(EnglishLevel)
  english_level?: EnglishLevel;

  @ApiPropertyOptional({
    type: Number,
    example: 3500,
    description: "The minimum salary for the position.",
  })
  @IsOptional()
  @IsInt()
  salary_min?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 5000,
    description: "The maximum salary for the position.",
  })
  @IsOptional()
  @IsInt()
  salary_max?: number;

  @ApiPropertyOptional({
    enum: Currency,
    example: Currency.EUR,
    description: "The currency for the salary.",
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    enum: Priority,
    example: Priority.MEDIUM,
    description: "The hiring priority for this job.",
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
