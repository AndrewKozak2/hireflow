import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { JobApproval } from "./job-approval.entity";
import { UserEntity } from "../../user/entities/user.entity";
import { JobStatus } from "../enums/job-status.enum";
import { Department } from "../../hiring-request/enums/department.enum";
import { ExpertiseLevel } from "../../hiring-request/enums/expertise-level.enum";
import { EnglishLevel } from "../../hiring-request/enums/english-level.enum";
import { LocationType } from "../../hiring-request/enums/location-type.enum";
import { EmploymentType } from "../../hiring-request/enums/employment-type.enum";
import { Currency } from "../../hiring-request/enums/currency.enum";
import { Priority } from "../../hiring-request/enums/priority.enum";

@Entity("job_listings")
export class Job {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({
    type: "enum",
    enum: JobStatus,
    default: JobStatus.DRAFT,
  })
  status!: JobStatus;

  @Column({ type: "enum", enum: EmploymentType, nullable: true })
  employmentType?: EmploymentType;

  @Column({ type: "enum", enum: LocationType, nullable: true })
  location?: LocationType;

  @Column({ type: "text", nullable: true })
  requirements?: string;

  @Column({ name: "nice_to_have", type: "text", nullable: true })
  niceToHave?: string;

  @Column({ type: "enum", enum: Department, nullable: true })
  department?: Department;

  @Column({ type: "int", nullable: true })
  headcount?: number;

  @Column({ type: "enum", enum: ExpertiseLevel, nullable: true })
  expertise_level?: ExpertiseLevel;

  @Column({ type: "enum", enum: EnglishLevel, nullable: true })
  english_level?: EnglishLevel;

  @Column({ type: "int", nullable: true })
  salary_min?: number;

  @Column({ type: "int", nullable: true })
  salary_max?: number;

  @Column({ type: "enum", enum: Currency, nullable: true })
  currency?: Currency;

  @Column({ type: "enum", enum: Priority, nullable: true })
  priority?: Priority;

  @Column({ name: "reason_for_opening", type: "text", nullable: true })
  reasonForOpening?: string;

  @Column({ name: "role_purpose", type: "text", nullable: true })
  rolePurpose?: string;

  @Column({ name: "first_90_days_goals", type: "text", nullable: true })
  first90DaysGoals?: string;

  @Column({ name: "recruiter_id" })
  recruiterId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "recruiter_id" })
  recruiter!: UserEntity;

  @Column({ name: "hiring_manager_id" })
  hiringManagerId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "hiring_manager_id" })
  hiringManager!: UserEntity;

  @CreateDateColumn({
    type: "timestamptz",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updated_at!: Date;

  @OneToMany(() => JobApproval, (approval) => approval.job)
  approvals!: JobApproval[];
}
