import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Job } from "./entities/job.entity";
import { JobApproval } from "./entities/job-approval.entity";
import { HiringRequestEntity } from "../hiring-request/entities/hiring-request.entity";
import { JobController } from "./job.controller";
import { JobService } from "./job.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobApproval, HiringRequestEntity]),
    NotificationsModule,
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
