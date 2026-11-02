import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { HiringRequestEntity } from "./hiring-request.entity";
import { UserEntity } from "../../user/entities/user.entity";
import { HiringRequestReviewAction } from "../enums/hiring-request-review-action.enum";

@Entity("hiring_request_reviews")
export class HiringRequestReviewEntity {
  @ApiProperty({ example: "uuid-v4-id" })
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ApiProperty({ example: "uuid-v4-hiring-request-id" })
  @Index()
  @Column()
  hiring_request_id!: string;

  @ManyToOne(() => HiringRequestEntity, (request) => request.reviews)
  @JoinColumn({ name: "hiring_request_id" })
  hiring_request!: HiringRequestEntity;

  @ApiProperty({ example: 1 })
  @Column({ type: "int" })
  round!: number;

  @ApiProperty({ example: "uuid-v4-reviewer-id" })
  @Index()
  @Column()
  reviewer_id!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "reviewer_id" })
  reviewer!: UserEntity;

  @ApiProperty({
    enum: HiringRequestReviewAction,
    example: HiringRequestReviewAction.REJECTED,
  })
  @Column({
    type: "enum",
    enum: HiringRequestReviewAction,
  })
  action!: HiringRequestReviewAction;

  @ApiPropertyOptional({
    example: "Please clarify the required technical experience.",
  })
  @Column({ type: "text", nullable: true })
  reason?: string | null;

  @ApiProperty({ example: "2026-06-02T00:00:00.000Z" })
  @CreateDateColumn()
  created_at!: Date;
}
