import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { RecruitmentCostCategory } from "../enums/recruitment-cost-category.enum";
import { RecruitmentCostCurrency } from "../enums/recruitment-cost-currency.enum";
import { Job } from "../../job/entities/job.entity";
import { Application } from "../../applications/entities/application.entity";
import { UserEntity } from "../../user/entities/user.entity";

@Entity("recruitment_costs")
export class RecruitmentCost {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "job_id" })
  jobId!: string;

  @Column({ type: "uuid", name: "application_id", nullable: true })
  applicationId!: string | null;

  @Column({ type: "enum", enum: RecruitmentCostCategory })
  category!: RecruitmentCostCategory;

  @Column({ type: "varchar", nullable: true })
  source!: string | null;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "enum",
    enum: RecruitmentCostCurrency,
    default: RecruitmentCostCurrency.USD,
  })
  currency!: RecruitmentCostCurrency;

  @Column({ type: "timestamptz", name: "incurred_at" })
  incurredAt!: Date;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "uuid", name: "created_by" })
  createdBy!: string;

  @Column({
    type: "varchar",
    unique: true,
    nullable: true,
    name: "automation_key",
  })
  automationKey!: string | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => Job, { onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job!: Job;

  @ManyToOne(() => Application, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "application_id" })
  application!: Application | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "created_by" })
  creator!: UserEntity;
}
