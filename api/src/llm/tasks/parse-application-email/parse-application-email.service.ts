import { Injectable } from "@nestjs/common";
import { LlmClientService } from "../../llm-client.service";
import { parseApplicationEmailTask } from "./parse-application-email.task";
import {
  ParsedApplicationEmailCandidateInfo,
  ParseApplicationEmailInput,
} from "./interfaces/parse-application-email.interface";

@Injectable()
export class ParseApplicationEmailService {
  constructor(private readonly llmClientService: LlmClientService) {}

  parse(
    input: ParseApplicationEmailInput,
  ): Promise<ParsedApplicationEmailCandidateInfo> {
    return this.llmClientService.runTask(parseApplicationEmailTask, input);
  }
}
