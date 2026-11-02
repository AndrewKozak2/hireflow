import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CandidateService } from "./candidate.service";
import { CandidateController } from "./candidate.controller";
import { Candidate } from "./entities/candidate.entity";
import { CandidateCv } from "./entities/candidate-cv.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, CandidateCv])],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}
