import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LlmClientService } from "./llm-client.service";
import { ParseApplicationEmailService } from "./tasks/parse-application-email/parse-application-email.service";
import { AnalyzeRejectionReasonService } from "./tasks/analyze-rejection-reason/analyze-rejection-reason.service";
import { GenerateScoreCardService } from "./tasks/generate-score-card/generate-score-card.service";
import { GenerateRejectionLetterService } from "./tasks/generate-rejection-letter/generate-rejection-letter.service";
import { AiScreeningService } from "./tasks/ai-screening/ai-screening.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LlmClientService,
    ParseApplicationEmailService,
    AnalyzeRejectionReasonService,
    GenerateScoreCardService,
    GenerateRejectionLetterService,
    AiScreeningService,
  ],
  exports: [
    LlmClientService,
    ParseApplicationEmailService,
    AnalyzeRejectionReasonService,
    GenerateScoreCardService,
    GenerateRejectionLetterService,
    AiScreeningService,
  ],
})
export class LlmModule {}
