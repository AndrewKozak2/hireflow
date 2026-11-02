import { Injectable, Logger } from "@nestjs/common";
import { LlmClientService } from "../../llm-client.service";
import { aiScreeningTask } from "./ai-screening.task";
import { GeneratedAiScreening } from "./interfaces/ai-screening.interface";
import { ParsedCvCandidateInfo } from "../parse-cv/interfaces/parse-cv.interface";

@Injectable()
export class AiScreeningService {
  private readonly logger = new Logger(AiScreeningService.name);

  constructor(private readonly llmClient: LlmClientService) {}

  async evaluateCandidate(
    jobTitle: string,
    jobRequirements: string[],
    parsedCv: ParsedCvCandidateInfo,
  ): Promise<GeneratedAiScreening> {
    this.logger.log(`Starting AI screening for job: ${jobTitle}`);

    const result = await this.llmClient.runTask(aiScreeningTask, {
      jobTitle,
      jobRequirements,
      parsedCv,
    });

    this.logger.log(
      `AI screening completed. Score: ${result.matchPercentage}%`,
    );

    return result;
  }
}
