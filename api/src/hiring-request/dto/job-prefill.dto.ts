import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Department } from "../enums/department.enum";
import { ExpertiseLevel } from "../enums/expertise-level.enum";
import { EnglishLevel } from "../enums/english-level.enum";
import { Currency } from "../enums/currency.enum";
import { EmploymentType } from "../enums/employment-type.enum";
import { LocationType } from "../enums/location-type.enum";

export class JobPrefillResponseDto {
  @ApiProperty({
    description: "The job title from the hiring request.",
    type: String,
    example: "Software Engineer",
  })
  title!: string;

  @ApiProperty({
    description: "A pre-generated job description.",
    type: String,
    example: "Department: Engineering\n",
  })
  description!: string;

  @ApiProperty({
    description: "The key requirements from the hiring request.",
    type: String,
    example: "5+ years of experience with Node.js",
    nullable: true,
  })
  requirements!: string | null;

  @ApiProperty({
    description: "The ID of the original hiring request.",
    type: String,
    example: "uuid-v4-hiring-request-id",
  })
  hiring_request_id!: string;

  @ApiProperty({
    description: "The ID of the hiring manager who created the request.",
    type: String,
    example: "uuid-v4-hiring-manager-id",
  })
  hiring_manager_id!: string;

  @ApiProperty({
    description: "The name of the hiring manager.",
    type: String,
    example: "John Doe",
  })
  hiring_manager_name!: string;

  @ApiProperty({
    type: String,
    example: LocationType.REMOTE,
    nullable: true,
    enum: LocationType,
  })
  location!: LocationType | null;

  @ApiPropertyOptional({
    type: String,
    example: EmploymentType.FULL_TIME,
    enum: EmploymentType,
    nullable: true,
  })
  employment_type?: EmploymentType | null;
  @ApiProperty({
    description: "The creation timestamp of the hiring request.",
    type: Date,
    example: "2026-01-01T00:00:00.000Z",
  })
  created_at!: Date;

  @ApiPropertyOptional({
    description: "The department for the position.",
    enum: Department,
    example: Department.ENGINEERING,
  })
  department?: Department;

  @ApiPropertyOptional({
    description: "The number of people to hire for this position.",
    type: Number,
    example: 1,
  })
  headcount?: number;

  @ApiPropertyOptional({
    description: "The required expertise level for the position.",
    enum: ExpertiseLevel,
    example: ExpertiseLevel.L3,
  })
  expertise_level?: ExpertiseLevel;

  @ApiPropertyOptional({
    description: "The required English proficiency level.",
    enum: EnglishLevel,
    example: EnglishLevel.B2,
  })
  english_level?: EnglishLevel;

  @ApiPropertyOptional({
    description: "The minimum salary for the position.",
    type: Number,
    example: 3000,
  })
  salary_min?: number;

  @ApiPropertyOptional({
    description: "The maximum salary for the position.",
    type: Number,
    example: 5000,
  })
  salary_max?: number;

  @ApiPropertyOptional({
    description: "The currency for the salary.",
    enum: Currency,
    example: Currency.USD,
  })
  currency?: Currency;
}
