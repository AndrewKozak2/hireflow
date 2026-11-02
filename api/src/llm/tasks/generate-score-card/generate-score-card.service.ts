import { Injectable } from "@nestjs/common";
import { LlmClientService } from "../../llm-client.service";
import { generateScoreCardTask } from "./generate-score-card.task";
import {
  GeneratedScoreCard,
  GenerateScoreCardInput,
} from "./interfaces/generate-score-card.interface";

@Injectable()
export class GenerateScoreCardService {
  constructor(private readonly llmClientService: LlmClientService) {}

  generate(input: GenerateScoreCardInput): Promise<GeneratedScoreCard> {
    return this.llmClientService.runTask(generateScoreCardTask, input);
  }
}
