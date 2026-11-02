import { LlmErrorCode } from "./interfaces/llm-error.interface";

export class LlmError extends Error {
  constructor(
    public readonly code: LlmErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export class LlmConfigError extends LlmError {
  constructor(message: string, details?: unknown) {
    super("LLM_CONFIG_ERROR", message, details);
    this.name = "LlmConfigError";
  }
}

export class LlmCompletionError extends LlmError {
  constructor(message: string, details?: unknown) {
    super("LLM_COMPLETION_ERROR", message, details);
    this.name = "LlmCompletionError";
  }
}

export class LlmTimeoutError extends LlmError {
  constructor(message: string, details?: unknown) {
    super("LLM_TIMEOUT", message, details);
    this.name = "LlmTimeoutError";
  }
}

export class LlmInvalidJsonError extends LlmError {
  constructor(message: string, details?: unknown) {
    super("LLM_INVALID_JSON", message, details);
    this.name = "LlmInvalidJsonError";
  }
}

export class LlmSchemaValidationError extends LlmError {
  constructor(message: string, details?: unknown) {
    super("LLM_SCHEMA_VALIDATION_ERROR", message, details);
    this.name = "LlmSchemaValidationError";
  }
}
