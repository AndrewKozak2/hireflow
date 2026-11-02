import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";
import { UserRole } from "../../auth/enums/userRole.enum";
import { UserStatus } from "../../auth/enums/userStatus.enum";

@Entity("users")
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({
    type: "enum",
    enum: UserRole,
  })
  role!: UserRole;

  @Column({ type: "timestamptz", nullable: true })
  notifications_cleared_at!: Date;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status!: UserStatus;

  @CreateDateColumn({
    type: "timestamptz",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updated_at!: Date;
}
