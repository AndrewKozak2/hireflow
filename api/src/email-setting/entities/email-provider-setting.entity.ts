import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("email_provider_settings")
export class EmailProviderSettingEntity {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Unique identifier of the email provider setting",
  })
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ApiProperty({
    example: "resend",
    description: "The active email provider used for outgoing emails",
  })
  @Column({ type: "varchar", nullable: false, default: "brevo" })
  provider!: string;

  @ApiProperty({ description: "Creation timestamp" })
  @CreateDateColumn({ type: "timestamp with time zone" })
  created_at!: Date;

  @ApiProperty({ description: "Last update timestamp" })
  @UpdateDateColumn({ type: "timestamp with time zone" })
  updated_at!: Date;
}
