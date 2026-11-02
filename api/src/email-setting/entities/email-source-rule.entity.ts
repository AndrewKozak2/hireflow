import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("email_source_rules")
export class EmailSourceRuleEntity {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Unique identifier of the rule",
  })
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ApiProperty({
    example: "*@djinni.co",
    description:
      "The email or domain pattern to match incoming sender addresses",
  })
  @Column({ type: "varchar", unique: true, nullable: false })
  sender_pattern!: string;

  @ApiProperty({
    example: "Djinni",
    description: "The label associated with this source",
  })
  @Column({ type: "varchar", nullable: false })
  source_label!: string;

  @ApiProperty({ description: "Creation timestamp" })
  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @ApiProperty({ description: "Last update timestamp" })
  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
