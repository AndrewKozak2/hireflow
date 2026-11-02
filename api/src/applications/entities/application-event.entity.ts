import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApplicationEventType } from "../enums/application-event-type.enum";
import { Application } from "./application.entity";
import { UserEntity } from "../../user/entities/user.entity";

@Entity("application_event")
export class ApplicationEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  applicationId!: string;

  @Column({ type: "uuid", nullable: true })
  actorId?: string;

  @Column({
    type: "enum",
    enum: ApplicationEventType,
  })
  type!: ApplicationEventType;

  @Column({ type: "jsonb", nullable: true })
  payload?: Record<string, any>;

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;

  @ManyToOne(() => Application, (application) => application.events, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "applicationId" })
  application!: Application;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "actorId" })
  actor?: UserEntity;
}
