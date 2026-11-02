import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecruitmentCost } from "./entity/recruitment-cost.entity";
import { RecruitmentCostsService } from "./recruitment-costs.service";
import { RecruitmentCostsController } from "./recruitment-costs.controller";
import { Job } from "../job/entities/job.entity";
import { Application } from "../applications/entities/application.entity";

@Module({
  imports: [TypeOrmModule.forFeature([RecruitmentCost, Job, Application])],
  controllers: [RecruitmentCostsController],
  providers: [RecruitmentCostsService],
  exports: [RecruitmentCostsService],
})
export class RecruitmentCostsModule {}
