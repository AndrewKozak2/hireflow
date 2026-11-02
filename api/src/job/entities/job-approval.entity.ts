import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Job } from "./job.entity";
import { UserEntity } from "../../user/entities/user.entity";

@Entity("job_approvals")
export class JobApproval {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  status!: string;

  @Column()
  action!: string;

  @Column({ name: "comment", type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  @Index()
  @ManyToOne(() => Job, (job) => job.approvals)
  @JoinColumn({ name: "job_id" })
  job!: Job;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;
}
