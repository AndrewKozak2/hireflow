import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Application } from "./application.entity";
import { UserEntity } from "../../user/entities/user.entity";
import { ScoreCardRecommendation } from "../enums/score-card-recommendation.enum";

@Entity("score_cards")
export class ScoreCard {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  applicationId!: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: "applicationId" })
  application!: Application;

  @Column({ type: "enum", enum: ScoreCardRecommendation })
  recommendation!: ScoreCardRecommendation;

  @Column({ type: "text", nullable: true })
  comment!: string;

  @Column({ type: "int", nullable: true })
  technicalSkillsScore!: number;

  @Column({ type: "int", nullable: true })
  problemSolvingScore!: number;

  @Column({ type: "int", nullable: true })
  communicationScore!: number;

  @Column({ type: "int", nullable: true })
  teamFitScore!: number;

  @Column("uuid")
  interviewerId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "interviewerId" })
  interviewer!: UserEntity;

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;
}
