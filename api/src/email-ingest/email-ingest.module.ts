import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailIngestController } from "./email-ingest.controller";
import { EmailIngestService } from "./email-ingest.service";
import { EmailIngestionEvent } from "./entities/email-ingestion-event.entity";
import { CandidateModule } from "src/candidate/candidate.module";
import { ApplicationsModule } from "src/applications/applications.module";
import { JobModule } from "src/job/job.module";
import { Candidate } from "src/candidate/entities/candidate.entity";
import { Application } from "../applications/entities/application.entity";
import { EmailSourceRuleEntity } from "src/email-setting/entities/email-source-rule.entity";
import { CandidateCv } from "src/candidate/entities/candidate-cv.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailIngestionEvent,
      EmailSourceRuleEntity,
      Candidate,
      Application,
      CandidateCv,
    ]),
    CandidateModule,
    ApplicationsModule,
    JobModule,
  ],
  controllers: [EmailIngestController],
  providers: [EmailIngestService],
})
export class EmailIngestModule {}
