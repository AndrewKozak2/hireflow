import { Injectable } from "@nestjs/common";
import { LlmClientService } from "../../llm-client.service";
import { analyzeRejectionReasonTask } from "./analyze-rejection-reason.task";
import {
  AnalyzeRejectionReasonInput,
  RejectionReasonAnalysis,
} from "./interfaces/analyze-rejection-reason.interface";

@Injectable()
export class AnalyzeRejectionReasonService {
  constructor(private readonly llmClientService: LlmClientService) {}

  analyze(
    input: AnalyzeRejectionReasonInput,
  ): Promise<RejectionReasonAnalysis> {
    return this.llmClientService.runTask(analyzeRejectionReasonTask, input);
  }
}
