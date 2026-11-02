import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BaseEntity,
} from "typeorm";
import { UserEntity } from "../../user/entities/user.entity";
import { NotificationType } from "../enums/notification-type.enum";
import { NotificationEmailStatus } from "../enums/notification-email-status.enum";

@Entity("notifications")
@Index("idx_notifications_user_id_created_at", ["userId", "created_at"])
@Index("idx_notifications_user_id_is_read", ["userId", "is_read"])
export class NotificationEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", nullable: true })
  recipient_email!: string | null;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type!: NotificationType;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any>;

  @Column({ type: "boolean", default: false })
  is_read!: boolean;

  @Column({
    type: "enum",
    enum: NotificationEmailStatus,
    default: NotificationEmailStatus.NONE,
  })
  email_status!: NotificationEmailStatus;

  @Column({ type: "text", nullable: true })
  email_error!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;
}
