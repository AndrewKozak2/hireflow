import Anthropic, {
  APIConnectionTimeoutError,
  APIError,
  AnthropicError,
} from "@anthropic-ai/sdk";
import type { Message, TextBlock } from "@anthropic-ai/sdk/resources/messages";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  LlmError,
  LlmCompletionError,
  LlmConfigError,
  LlmInvalidJsonError,
  LlmSchemaValidationError,
  LlmTimeoutError,
} from "./llm.errors";
import {
  LlmModelTier,
  LlmRequestOptions,
  LlmRunOptions,
  LlmTask,
} from "./interfaces/llm.interface";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_MAX_TOKENS = 1_000;
const DEFAULT_SYSTEM_PROMPT =
  "You are a structured data extraction service. Return only valid JSON that matches the requested schema. Do not include markdown or explanatory text.";

@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);
  private anthropicClient?: Anthropic;

  constructor(private readonly configService: ConfigService) {}

  async runTask<Input, Output>(
    task: LlmTask<Input, Output>,
    input: Input,
    options: LlmRunOptions = {},
  ): Promise<Output> {
    const tier = options.tier ?? task.tier;
    const requestOptions: LlmRequestOptions = {
      taskName: task.name,
      tier,
      model: this.getModelForTier(tier),
      systemPrompt: task.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      prompt: task.buildPrompt(input),
      temperature:
        options.temperature ??
        task.temperature ??
        this.getNumberConfig("LLM_TEMPERATURE", DEFAULT_TEMPERATURE),
      maxTokens:
        options.maxTokens ??
        task.maxTokens ??
        this.getNumberConfig("LLM_MAX_TOKENS", DEFAULT_MAX_TOKENS),
      timeoutMs:
        options.timeoutMs ??
        task.timeoutMs ??
        this.getNumberConfig("LLM_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
    };
    const retryAttempts =
      options.retryAttempts ??
      task.retryAttempts ??
      this.getNumberConfig("LLM_RETRY_ATTEMPTS", DEFAULT_RETRY_ATTEMPTS);

    const startedAt = Date.now();
    this.logger.log(
      `Running LLM task ${task.name} with ${tier} tier (${requestOptions.model}); prompt length=${requestOptions.prompt.length}`,
    );

    const rawText = await this.complete(requestOptions, retryAttempts).catch(
      (error: unknown) => {
        throw this.normalizeError(error, task.name);
      },
    );
    this.logger.debug(
      `LLM task ${task.name} returned ${rawText.length} characters`,
    );

    const parsedJson = this.parseJson(rawText, task.name);

    try {
      const parsedOutput = task.outputSchema.parse(parsedJson);
      this.logger.log(
        `Completed LLM task ${task.name} in ${Date.now() - startedAt}ms`,
      );
      return parsedOutput;
    } catch (error) {
      if (error instanceof LlmSchemaValidationError) {
        throw error;
      }

      throw new LlmSchemaValidationError(
        `LLM task ${task.name} returned output that does not match ${task.outputSchema.name}`,
        error,
      );
    }
  }

  private async complete(
    options: LlmRequestOptions,
    retryAttempts: number,
  ): Promise<string> {
    const message = await this.getAnthropicClient().messages.create(
      {
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: options.systemPrompt,
        messages: [{ role: "user", content: options.prompt }],
      },
      {
        timeout: options.timeoutMs,
        maxRetries: Math.max(0, retryAttempts - 1),
      },
    );

    this.logger.log(
      ` Token Usage for ${options.taskName}: Input = ${message.usage.input_tokens}, Output = ${message.usage.output_tokens}`,
    );

    const text = this.readResponseText(message);
    if (!text) {
      throw new LlmCompletionError("LLM response did not contain text", {
        taskName: options.taskName,
        requestId: message._request_id,
        stopReason: message.stop_reason,
      });
    }

    return text;
  }

  private parseJson(rawText: string, taskName: string): unknown {
    const normalized = rawText
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

    try {
      const parsed: unknown = JSON.parse(normalized);
      return parsed;
    } catch (error: unknown) {
      throw new LlmInvalidJsonError(
        `LLM task ${taskName} returned invalid JSON`,
        { rawText, error },
      );
    }
  }

  private normalizeError(error: unknown, taskName: string): Error {
    if (error instanceof LlmError) {
      return error;
    }

    if (error instanceof APIConnectionTimeoutError) {
      return new LlmTimeoutError(`LLM task ${taskName} timed out`, {
        message: error.message,
      });
    }

    if (error instanceof APIError) {
      const status = error.status as number | undefined;
      const providerError: unknown = error.error;
      return new LlmCompletionError(
        `LLM request returned ${status ?? "unknown"} for task ${taskName}`,
        {
          status,
          type: error.type,
          requestId: error.requestID,
          error: providerError,
        },
      );
    }

    if (error instanceof AnthropicError) {
      return new LlmCompletionError(`LLM task ${taskName} failed`, {
        message: error.message,
      });
    }

    if (error instanceof Error) {
      return new LlmCompletionError(`LLM task ${taskName} failed`, {
        name: error.name,
        message: error.message,
      });
    }

    return new LlmCompletionError(`LLM task ${taskName} failed`, error);
  }

  private readResponseText(message: Message): string | null {
    const textBlocks = message.content
      .filter((block): block is TextBlock => block.type === "text")
      .map((block) => block.text);

    return textBlocks.join("\n").trim() || null;
  }

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({ apiKey: this.getApiKey() });
    }

    return this.anthropicClient;
  }

  private getApiKey(): string {
    const apiKey = this.configService.get<string>("LLM_API_KEY");

    if (!apiKey) {
      throw new LlmConfigError("Missing LLM_API_KEY");
    }

    return apiKey;
  }

  private getModelForTier(tier: LlmModelTier): string {
    const configKey = tier === "light" ? "LLM_MODEL_LIGHT" : "LLM_MODEL_HEAVY";
    return this.getRequiredStringConfig(configKey);
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = this.configService.get<string | number>(key);
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getRequiredStringConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new LlmConfigError(`Missing ${key}`);
    }

    return value;
  }
}
