import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { ApplicationStage } from "../enums/application-stage.enum";
import { AiRecommendation } from "../enums/ai-recommendation.enum";
import { RejectionReason } from "../enums/rejection-reason.enum";
import { Candidate } from "../../candidate/entities/candidate.entity";
import { Job } from "../../job/entities/job.entity";
import { UserEntity } from "../../user/entities/user.entity";
import { ApplicationComment } from "./application-comment.entity";
import { ApplicationEvent } from "./application-event.entity";
import { ScoreCard } from "./score-card.entity";

@Entity("applications")
@Unique(["candidateId", "jobId"])
export class Application {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  candidateId!: string;

  @Column("uuid", { nullable: true })
  jobId!: string | null;

  @Column({ type: "varchar", default: "email" })
  source!: string;

  @Column({
    type: "enum",
    enum: ApplicationStage,
    default: ApplicationStage.NEW,
  })
  stage!: ApplicationStage;

  @Column({ type: "int", nullable: true })
  aiScore?: number;

  @Column({ type: "text", nullable: true })
  aiSummary?: string;

  @Column({
    type: "enum",
    enum: AiRecommendation,
    nullable: true,
  })
  aiRecommendation?: AiRecommendation;

  @Column({
    type: "enum",
    enum: RejectionReason,
    nullable: true,
  })
  rejectionReason?: RejectionReason;

  @Column({ type: "text", nullable: true })
  rejectionComment?: string;

  @Column({ type: "uuid", nullable: true })
  recruiterId?: string;

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updatedAt!: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    name: "actualMonthlySalary",
  })
  actualMonthlySalary!: number | null;

  @Column({ type: "varchar", nullable: true, name: "salaryCurrency" })
  salaryCurrency!: string | null;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    name: "recruiterCommissionPercent",
  })
  recruiterCommissionPercent!: number | null;

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: "candidateId" })
  candidate!: Candidate;

  @ManyToOne(() => Job, { nullable: true })
  @JoinColumn({ name: "jobId" })
  job!: Job | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "recruiterId" })
  recruiter?: UserEntity;

  @OneToMany(() => ApplicationComment, (comment) => comment.application)
  comments!: ApplicationComment[];

  @OneToMany(() => ApplicationEvent, (event) => event.application)
  events!: ApplicationEvent[];

  @OneToMany(() => ScoreCard, (scoreCard) => scoreCard.application)
  scoreCards!: ScoreCard[];
}
