import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Department } from "../enums/department.enum";
import { ExpertiseLevel } from "../enums/expertise-level.enum";
import { EnglishLevel } from "../enums/english-level.enum";
import { LocationType } from "../enums/location-type.enum";
import { EmploymentType } from "../enums/employment-type.enum";
import { Currency } from "../enums/currency.enum";
import { Priority } from "../enums/priority.enum";

export class CreateHiringRequestDto {
  // 2. Position
  @ApiProperty({
    example: "Software Engineer",
    description: "The title of the job",
  })
  @IsString()
  @IsNotEmpty()
  job_title!: string;

  @ApiProperty({
    example: "Growth of the engineering team",
    description: "Reason for opening the position",
  })
  @IsString()
  @IsNotEmpty()
  reason_for_opening!: string;

  @ApiProperty({
    enum: Department,
    example: Department.ENGINEERING,
    description: "The department for the position",
  })
  @IsEnum(Department)
  @IsNotEmpty()
  department!: Department;

  @ApiProperty({ example: 1, description: "Number of people to hire" })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  headcount!: number;

  // 3. Level of expertise
  @ApiPropertyOptional({
    enum: ExpertiseLevel,
    example: ExpertiseLevel.L3,
    description: "Required expertise level",
  })
  @IsEnum(ExpertiseLevel)
  @IsOptional()
  expertise_level?: ExpertiseLevel;

  // 4. English proficiency
  @ApiPropertyOptional({
    enum: EnglishLevel,
    example: EnglishLevel.B2,
    description: "Required English proficiency level",
  })
  @IsEnum(EnglishLevel)
  @IsOptional()
  english_level?: EnglishLevel;

  // 5. Candidate profile
  @ApiPropertyOptional({
    example: 3,
    description: "Years of experience required",
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  required_experience_years?: number;

  @ApiPropertyOptional({
    example: "Backend Developer, Fullstack Developer",
    description: "Previous roles that might be a good fit",
  })
  @IsString()
  @IsOptional()
  past_potential_positions?: string;

  @ApiPropertyOptional({
    example: "Experience with NestJS and TypeScript",
    description: "Key technical requirements",
  })
  @IsString()
  @IsOptional()
  key_requirements?: string;

  @ApiPropertyOptional({
    example: "AWS Certified Solutions Architect",
    description: "Required or desired certifications",
  })
  @IsString()
  @IsOptional()
  certifications_courses?: string;

  @ApiPropertyOptional({
    example: "Team player, proactive, good communicator",
    description: "Soft skills and personal qualities",
  })
  @IsString()
  @IsOptional()
  desired_personal_qualities?: string;

  @ApiPropertyOptional({
    example: "Poor communication, lack of accountability",
    description: "Qualities that would make a candidate a bad fit",
  })
  @IsString()
  @IsOptional()
  unacceptable_personal_qualities?: string;

  // 6. Role & scope
  @ApiProperty({
    example: "To build and maintain scalable backend services",
    description: "The primary goal and purpose of the role",
  })
  @IsString()
  @IsNotEmpty()
  role_purpose!: string;

  @ApiPropertyOptional({
    example: "API design, database optimization, mentoring junior developers",
    description: "Specific areas and tasks the hire will be responsible for",
  })
  @IsString()
  @IsOptional()
  area_of_responsibility?: string;

  @ApiPropertyOptional({
    example:
      "Deliver 3 key features, complete onboarding, understand system architecture",
    description: "Goals to be achieved in the first 3 months",
  })
  @IsString()
  @IsOptional()
  first_90_days_goals?: string;

  @ApiPropertyOptional({
    example: "Lead a small team of developers, drive architectural decisions",
    description: "Potential growth and future duties after the initial period",
  })
  @IsString()
  @IsOptional()
  future_responsibilities?: string;

  // 7. Reporting structure
  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "The ID of the user this role reports to",
  })
  @IsUUID()
  @IsOptional()
  reports_to_id?: string;

  @ApiPropertyOptional({
    example: "3 Junior Developers, 1 QA Engineer",
    description: "Details about the people reporting to this position",
  })
  @IsString()
  @IsOptional()
  direct_reports?: string;

  // 8. Logistics
  @ApiPropertyOptional({
    enum: LocationType,
    example: LocationType.REMOTE,
    description: "Work location type",
  })
  @IsEnum(LocationType)
  @IsOptional()
  location?: LocationType;

  @ApiPropertyOptional({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
    description: "Type of employment",
  })
  @IsEnum(EmploymentType)
  @IsOptional()
  employment_type?: EmploymentType;

  @ApiPropertyOptional({
    example: "2026-06-01",
    description: "Target start date",
  })
  @IsDateString()
  @IsOptional()
  target_start_date?: string;

  @ApiPropertyOptional({
    example: "2026-05-31",
    description: "Deadline for hiring",
  })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({ example: 80000, description: "Minimum annual salary" })
  @IsInt()
  @Min(0)
  @IsOptional()
  salary_min?: number;

  @ApiPropertyOptional({
    example: 120000,
    description: "Maximum annual salary",
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  salary_max?: number;

  @ApiPropertyOptional({
    enum: Currency,
    example: Currency.USD,
    description: "Salary currency",
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiPropertyOptional({
    enum: Priority,
    example: Priority.MEDIUM,
    description: "Priority level of the hiring request",
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  // 9. Attachments & notes
  @ApiPropertyOptional({
    type: [String],
    example: ["https://storage.example.com/template.pdf"],
    description: "List of attachment URLs or file names",
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({
    example: "Please prioritize candidates with startup experience.",
    description: "Notes from the hiring manager for the recruiter",
  })
  @IsString()
  @IsOptional()
  hm_notes_for_recruiter?: string;

  @ApiPropertyOptional({
    example: [
      {
        id: "note-uuid",
        date_time: "2026-06-03T12:00:00.000Z",
        text: "Focus on candidates with strong problem-solving skills",
      },
    ],
    description: "Additional instructions or context for the recruiter",
  })
  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  notes_for_recruiter?: Array<{
    id: string;
    date_time: string;
    text: string;
  }>;
}
