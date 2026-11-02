import type Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";
import { ConfigService } from "@nestjs/config";
import { LlmClientService } from "../../src/llm/llm-client.service";
import {
  LlmCompletionError,
  LlmInvalidJsonError,
  LlmSchemaValidationError,
  LlmTimeoutError,
} from "../../src/llm/llm.errors";
import type {
  LlmModelTier,
  LlmTask,
} from "../../src/llm/interfaces/llm.interface";
import type { BenchConfig, CallStatus } from "./types";

/** The one Anthropic call the service makes: a non-streaming `messages.create`. */
export interface MessagesApi {
  create(
    body: MessageCreateParamsNonStreaming,
    options?: { timeout?: number; maxRetries?: number },
  ): Promise<Message>;
}

export interface CallOutcome<Output> {
  status: Exclude<CallStatus, "skipped">;
  output: Output | null;
  modelRequested: string;
  modelResponded: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  rawText: string;
  stopReason: string;
  error: string;
  /** Whether a retry could help: timeouts, connection errors, 408/409/429/5xx. */
  retryable: boolean;
}

/**
 * Empty on purpose: if a request ever bypassed the recorder, the service would
 * fail on the missing key before building a client, so no request leaves the
 * process (an empty internal value still wins over process.env).
 */
const NO_API_KEY = "";

/**
 * Runs `task` through the real `LlmClientService`, so the prompt, the default
 * system prompt, the temperature/maxTokens chain, JSON parsing and schema
 * validation are exactly production's. The only thing swapped is the Anthropic
 * client underneath, which records usage, latency and the raw answer.
 */
export async function runInstrumentedTask<Input, Output>(
  api: MessagesApi,
  config: BenchConfig,
  task: LlmTask<Input, Output>,
  input: Input,
  tier: LlmModelTier,
): Promise<CallOutcome<Output>> {
  const recorded: {
    calls: number;
    response?: Message;
    latencyMs?: number;
  } = { calls: 0 };

  const recordingClient = {
    messages: {
      create: async (
        body: MessageCreateParamsNonStreaming,
        options?: { timeout?: number; maxRetries?: number },
      ): Promise<Message> => {
        recorded.calls += 1;
        const startedAt = performance.now();
        try {
          recorded.response = await api.create(body, options);
          return recorded.response;
        } finally {
          recorded.latencyMs = performance.now() - startedAt;
        }
      },
    },
  };

  // Internal config wins over process.env in ConfigService, so a local .env
  // can't swap the pinned models or settings.
  const service = new LlmClientService(
    new ConfigService({
      LLM_API_KEY: NO_API_KEY,
      LLM_MODEL_LIGHT: config.models.light,
      LLM_MODEL_HEAVY: config.models.heavy,
      LLM_TEMPERATURE: config.llm.temperature,
      LLM_MAX_TOKENS: config.llm.maxTokens,
      LLM_TIMEOUT_MS: config.llm.timeoutMs,
      LLM_RETRY_ATTEMPTS: 1,
    }),
  );
  // The service builds its Anthropic client lazily and reuses an existing one
  // (llm-client.service.ts, getAnthropicClient), so setting the field first
  // routes its request through the recorder.
  service["anthropicClient"] = recordingClient as unknown as Anthropic;

  const modelRequested = config.models[tier];
  let output: Output | null = null;
  let failure: unknown = null;
  try {
    // retryAttempts: 1 → maxRetries: 0, so the latency measured is a single
    // request; the runner retries transport errors itself and counts them.
    output = await service.runTask(task, input, { tier, retryAttempts: 1 });
  } catch (error) {
    failure = error;
  }

  if (recorded.calls !== 1) {
    throw new Error(
      `Bench seam broken: expected exactly 1 request through the recording client, saw ${recorded.calls}. ` +
        "Has LlmClientService.anthropicClient been renamed?",
    );
  }

  const response = recorded.response;
  const rawText = response ? readResponseText(response) : "";
  return {
    status:
      failure === null ? "ok" : classifyFailure(failure, response, rawText),
    output,
    modelRequested,
    modelResponded: response?.model ?? "",
    inputTokens: response?.usage.input_tokens ?? null,
    outputTokens: response?.usage.output_tokens ?? null,
    latencyMs: recorded.latencyMs ?? null,
    rawText,
    stopReason: response?.stop_reason ?? "",
    error: failure === null ? "" : describeError(failure),
    retryable: failure !== null && !response && isRetryable(failure),
  };
}

/** Same joining as LlmClientService.readResponseText, for the record only. */
function readResponseText(message: Message): string {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function classifyFailure(
  error: unknown,
  response: Message | undefined,
  rawText: string,
): CallOutcome<unknown>["status"] {
  if (response) {
    if (!rawText) return "empty";
    if (error instanceof LlmInvalidJsonError) return "invalid_json";
    if (error instanceof LlmSchemaValidationError) return "schema_invalid";
    return "api_error";
  }
  return error instanceof LlmTimeoutError ? "timeout" : "api_error";
}

function isRetryable(error: unknown): boolean {
  if (error instanceof LlmTimeoutError) return true;
  if (!(error instanceof LlmCompletionError)) return false;
  const details = error.details as { status?: unknown } | undefined;
  const status = typeof details?.status === "number" ? details.status : null;
  return (
    status === null ||
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status >= 500
  );
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const details = (error as { details?: unknown }).details;
  const status =
    typeof (details as { status?: unknown })?.status === "number"
      ? ` (HTTP ${(details as { status: number }).status})`
      : "";
  return `${error.name}: ${error.message}${status}`;
}
