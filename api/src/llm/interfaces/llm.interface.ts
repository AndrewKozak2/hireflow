export type LlmModelTier = "light" | "heavy";

export interface LlmOutputSchema<Output> {
  name: string;
  parse(value: unknown): Output;
}

export interface LlmTask<Input, Output> {
  name: string;
  tier: LlmModelTier;
  systemPrompt?: string;
  buildPrompt(input: Input): string;
  outputSchema: LlmOutputSchema<Output>;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retryAttempts?: number;
}

export interface LlmRunOptions {
  tier?: LlmModelTier;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retryAttempts?: number;
}

export interface LlmRequestOptions {
  taskName: string;
  tier: LlmModelTier;
  model: string;
  systemPrompt: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}
