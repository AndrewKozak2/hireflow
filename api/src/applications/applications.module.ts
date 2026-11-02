import { Module } from "@nestjs/common";
import { ApplicationsService } from "./applications.service";
import { ApplicationsController } from "./applications.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Application } from "./entities/application.entity";
import { ApplicationComment } from "./entities/application-comment.entity";
import { ApplicationEvent } from "./entities/application-event.entity";
import { ScoreCard } from "./entities/score-card.entity";
import { CandidateCv } from "src/candidate/entities/candidate-cv.entity";
import { StorageModule } from "../storage/storage.module";
import { MailModule } from "../shared/services/mail.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LlmModule } from "../llm/llm.module";
import { GenerateRejectionLetterService } from "../llm/tasks/generate-rejection-letter/generate-rejection-letter.service";
import { RecruitmentCost } from "../recruitment-costs/entity/recruitment-cost.entity";
import { Candidate } from "src/candidate/entities/candidate.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      ApplicationComment,
      ApplicationEvent,
      ScoreCard,
      CandidateCv,
      RecruitmentCost,
      Candidate,
      LlmModule,
    ]),
    StorageModule,
    MailModule,
    NotificationsModule,
    LlmModule,
  ],
  providers: [ApplicationsService, GenerateRejectionLetterService],
  controllers: [ApplicationsController],
})
export class ApplicationsModule {}
