import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserEntity } from "../../user/entities/user.entity";
import { UserRole } from "../enums/userRole.enum";

@Entity("invitations")
export class InvitationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  email!: string;

  @Column({ unique: true })
  token!: string;

  @Column({
    type: "enum",
    enum: UserRole,
  })
  role!: UserRole;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "invited_by" })
  invited_by!: UserEntity;

  @Column({ type: "timestamptz" })
  expires_at!: Date;

  @Column({ type: "timestamptz", nullable: true })
  accepted_at?: Date;
}
