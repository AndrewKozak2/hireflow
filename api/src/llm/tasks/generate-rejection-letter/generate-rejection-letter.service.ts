import { Injectable } from "@nestjs/common";
import { LlmClientService } from "../../llm-client.service";
import { generateRejectionLetterTask } from "./generate-rejection-letter.task";
import {
  GeneratedRejectionLetterDraft,
  GenerateRejectionLetterInput,
} from "./interfaces/generate-rejection-letter.interface";

@Injectable()
export class GenerateRejectionLetterService {
  constructor(private readonly llmClientService: LlmClientService) {}

  generate(
    input: GenerateRejectionLetterInput,
  ): Promise<GeneratedRejectionLetterDraft> {
    return this.llmClientService.runTask(generateRejectionLetterTask, input);
  }
}
