import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserEntity } from "../../user/entities/user.entity";
import { HiringRequestStatus } from "../enums/hiring-status.enum";
import { Department } from "../enums/department.enum";
import { LocationType } from "../enums/location-type.enum";
import { EmploymentType } from "../enums/employment-type.enum";
import { Currency } from "../enums/currency.enum";
import { ExpertiseLevel } from "../enums/expertise-level.enum";
import { EnglishLevel } from "../enums/english-level.enum";
import { Priority } from "../enums/priority.enum";
import { HiringRequestReviewEntity } from "./hiring-request-review.entity";

@Entity("hiring_requests")
export class HiringRequestEntity extends BaseEntity {
  @ApiProperty({ example: "uuid-v4-id" })
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // 1. Submitter
  @ApiProperty({ example: "manager@example.com" })
  @Column()
  submitter_email!: string;

  // 2. Position
  @ApiPropertyOptional({ example: "Software Engineer" })
  @Column({ nullable: true })
  job_title?: string;

  @Column({ nullable: true })
  job_id?: string;

  @ApiPropertyOptional({ example: "Replacing a team member" })
  @Column({ type: "text", nullable: true })
  reason_for_opening?: string;

  @ApiPropertyOptional({ enum: Department, example: Department.ENGINEERING })
  @Column({ type: "enum", enum: Department, nullable: true })
  department?: Department;

  @ApiProperty({ example: 1 })
  @Column({ type: "int" })
  headcount!: number;

  // 3. Level of expertise
  @ApiPropertyOptional({ enum: ExpertiseLevel, example: ExpertiseLevel.L3 })
  @Column({ type: "enum", enum: ExpertiseLevel, nullable: true })
  expertise_level?: ExpertiseLevel;

  // 4. English proficiency
  @ApiPropertyOptional({ enum: EnglishLevel, example: EnglishLevel.C1 })
  @Column({ type: "enum", enum: EnglishLevel, nullable: true })
  english_level?: EnglishLevel;

  // 5. Candidate profile
  @ApiPropertyOptional({ example: 5 })
  @Column({ type: "int", nullable: true })
  required_experience_years?: number;

  @ApiPropertyOptional({ example: "Senior Developer, Tech Lead" })
  @Column({ type: "text", nullable: true })
  past_potential_positions?: string;

  @ApiPropertyOptional({ example: "React, Node.js, TypeScript" })
  @Column({ type: "text", nullable: true })
  key_requirements?: string;

  @ApiPropertyOptional({ example: "AWS Certified Developer" })
  @Column({ type: "text", nullable: true })
  certifications_courses?: string;

  @ApiPropertyOptional({ example: "Team player, Proactive" })
  @Column({ type: "text", nullable: true })
  desired_personal_qualities?: string;

  @ApiPropertyOptional({ example: "Arrogance" })
  @Column({ type: "text", nullable: true })
  unacceptable_personal_qualities?: string;

  // 6. Role & scope
  @ApiPropertyOptional({ example: "Build and maintain features" })
  @Column({ type: "text", nullable: true })
  role_purpose?: string;

  @ApiPropertyOptional({ example: "API design, Database management" })
  @Column({ type: "text", nullable: true })
  area_of_responsibility?: string;

  @ApiPropertyOptional({ example: "Deliver feature X" })
  @Column({ type: "text", nullable: true })
  first_90_days_goals?: string;

  @ApiPropertyOptional({ example: "Mentoring juniors" })
  @Column({ type: "text", nullable: true })
  future_responsibilities?: string;

  // 7. Reporting structure
  @ApiPropertyOptional({ example: "uuid-v4-manager-id" })
  @Column({ nullable: true })
  reports_to_id?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "reports_to_id" })
  reports_to?: UserEntity;

  @ApiPropertyOptional({ example: "2 developers" })
  @Column({ type: "text", nullable: true })
  direct_reports?: string;

  // 8. Logistics
  @ApiPropertyOptional({ enum: LocationType, example: LocationType.REMOTE })
  @Column({ type: "enum", enum: LocationType, nullable: true })
  location?: LocationType;

  @ApiPropertyOptional({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @Column({ type: "enum", enum: EmploymentType, nullable: true })
  employment_type?: EmploymentType;

  @ApiPropertyOptional({ example: "2023-10-01" })
  @Column({ type: "date", nullable: true })
  target_start_date?: Date;

  @ApiPropertyOptional({ example: "2023-09-01" })
  @Column({ type: "date", nullable: true })
  deadline?: Date;

  @ApiPropertyOptional({ example: 50000 })
  @Column({ type: "int", nullable: true })
  salary_min?: number;

  @ApiPropertyOptional({ example: 80000 })
  @Column({ type: "int", nullable: true })
  salary_max?: number;

  @ApiPropertyOptional({ enum: Currency, example: Currency.USD })
  @Column({ type: "enum", enum: Currency, nullable: true })
  currency?: Currency;

  @ApiPropertyOptional({ enum: Priority, example: Priority.MEDIUM })
  @Column({ type: "enum", enum: Priority, nullable: true })
  priority?: Priority;

  // 9. Attachments & notes
  @ApiPropertyOptional({ example: ["url1", "url2"] })
  @Column({ type: "simple-array", nullable: true })
  attachments?: string[];

  @ApiPropertyOptional({
    example: "Please prioritize candidates with startup experience.",
  })
  @Column({ type: "text", nullable: true })
  hm_notes_for_recruiter?: string;

  @ApiPropertyOptional({
    example: [
      {
        id: "note-uuid",
        date_time: "2026-06-03T12:00:00.000Z",
        text: "Additional context for recruiter",
      },
    ],
  })
  @Column({ type: "jsonb", nullable: true })
  notes_for_recruiter?: Array<{
    id: string;
    date_time: string;
    text: string;
  }>;

  // --- Meta & Status ---
  @ApiProperty({
    enum: HiringRequestStatus,
    example: HiringRequestStatus.PENDING,
  })
  @Column({
    type: "enum",
    enum: HiringRequestStatus,
    default: HiringRequestStatus.PENDING,
  })
  status!: HiringRequestStatus;

  @ApiProperty({ example: "uuid-v4-creator-id" })
  @Column()
  created_by_id!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "created_by_id" })
  created_by!: UserEntity;

  @ApiPropertyOptional({ example: "uuid-v4-recruiter-id" })
  @Column({ nullable: true })
  assigned_recruiter_id?: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "assigned_recruiter_id" })
  assigned_recruiter?: UserEntity | null;

  @OneToMany(() => HiringRequestReviewEntity, (review) => review.hiring_request)
  reviews!: HiringRequestReviewEntity[];

  @ApiPropertyOptional({ example: "uuid-v4-canceller-id" })
  @Column({ nullable: true })
  cancelled_by_id?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "cancelled_by_id" })
  cancelled_by?: UserEntity;

  @Column({ type: "timestamptz", nullable: true })
  cancelled_at?: Date;

  @CreateDateColumn({
    type: "timestamptz",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updated_at!: Date;
}
