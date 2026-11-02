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

@Entity("application_comment")
export class ApplicationComment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  applicationId!: string;

  @Column("uuid")
  authorId!: string;

  @Column("text")
  content!: string;

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;

  @ManyToOne(() => Application, (application) => application.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "applicationId" })
  application!: Application;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author!: UserEntity;
}
