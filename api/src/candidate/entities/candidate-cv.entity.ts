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
import { Candidate } from "./candidate.entity";

@Entity("candidate_cvs")
export class CandidateCv {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column()
  candidateId!: string;

  @Column()
  fileUrl!: string;

  @Column()
  originalFilename!: string;

  @Column({ default: true })
  isCurrent!: boolean;

  @CreateDateColumn({
    type: "timestamptz",
  })
  uploadedAt!: Date;

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updatedAt!: Date;

  @ManyToOne(() => Candidate, (candidate) => candidate.cvs)
  @JoinColumn({ name: "candidateId" })
  candidate!: Candidate;
}
