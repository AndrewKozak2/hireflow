import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { CandidateCv } from "./candidate-cv.entity";

@Entity("candidates")
export class Candidate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  firstName!: string;

  @Index()
  @Column()
  lastName!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  linkedinUrl!: string;

  @Column({ type: "text", array: true, default: "{}" })
  skills!: string[];

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updatedAt!: Date;

  @OneToMany(() => CandidateCv, (cv) => cv.candidate)
  cvs!: CandidateCv[];

  @Column({ type: "boolean", default: false })
  isAutoCreated!: boolean;
}
