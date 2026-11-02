import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { EmailIngestionStatus } from "../enums/email-ingestion-status.enum";
import { Candidate } from "../../candidate/entities/candidate.entity";

@Entity("email_ingestion_event")
export class EmailIngestionEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column()
  gmailMessageId!: string;

  @Index()
  @Column()
  sender!: string;

  @Column({
    type: "enum",
    enum: EmailIngestionStatus,
    default: EmailIngestionStatus.RECEIVED,
  })
  status!: EmailIngestionStatus;

  @Column({ type: "uuid", nullable: true })
  candidateId?: string | null;

  @Column({ type: "jsonb", nullable: true })
  classificationResult?: Record<string, any> | null;

  @Column({ type: "text", nullable: true })
  errorMessage?: string | null;

  @ManyToOne(() => Candidate, { nullable: true })
  @JoinColumn({ name: "candidateId" })
  candidate?: Candidate | null;

  @Column({ nullable: true })
  threadId?: string;

  @Column({ nullable: true })
  forwardedBy?: string;

  @Column("uuid", { nullable: true })
  applicationId?: string | null;

  @Column({
    type: "timestamptz",
    nullable: true,
  })
  receivedAt?: Date | null;

  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;

  @Column({ type: "jsonb", nullable: true })
  attachmentManifest?: Record<string, unknown>[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
