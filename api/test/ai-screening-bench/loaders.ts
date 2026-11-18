import { readdirSync, readFileSync } from "fs";
import { basename, extname, join, resolve } from "path";
import type { LlmModelTier } from "../../src/llm/interfaces/llm.interface";
import {
  BenchConfig,
  BenchConfiguration,
  BenchCv,
  BenchDataset,
  BenchJob,
  BenchPair,
  HumanLabel,
  PriceList,
  RECOMMENDATIONS,
} from "./types";

export const BENCH_DIR = __dirname;
export const DEFAULT_CONFIG_PATH = join(BENCH_DIR, "bench.config.json");
export const DEFAULT_DATASET_DIR = join(BENCH_DIR, "data");

const TIERS: readonly LlmModelTier[] = ["light", "heavy"];

class BenchDataError extends Error {
  constructor(source: string, message: string) {
    super(`${source}: ${message}`);
    this.name = "BenchDataError";
  }
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (error) {
    throw new BenchDataError(
      path,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(source: string, value: unknown, key: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BenchDataError(source, `${key} must be a non-empty string`);
  }
  return value;
}

function requireNumber(source: string, value: unknown, key: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BenchDataError(source, `${key} must be a number`);
  }
  return value;
}

function requirePositiveInteger(
  source: string,
  value: unknown,
  key: string,
): number {
  const number = requireNumber(source, value, key);
  if (!Number.isInteger(number) || number < 1) {
    throw new BenchDataError(source, `${key} must be a positive integer`);
  }
  return number;
}

function requireTier(source: string, value: unknown, key: string) {
  if (!TIERS.includes(value as LlmModelTier)) {
    throw new BenchDataError(
      source,
      `${key} must be one of ${TIERS.join(", ")}`,
    );
  }
  return value as LlmModelTier;
}

/** Same split as production does before screening (applications.service.ts). */
export function splitRequirements(requirements: string): string[] {
  return requirements
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
}

function parseConfiguration(
  source: string,
  value: unknown,
): BenchConfiguration {
  if (!isRecord(value)) {
    throw new BenchDataError(source, "each configuration must be an object");
  }
  const name = requireString(source, value.name, "configuration.name");
  const where = `configuration "${name}"`;
  const screenTier = requireTier(
    source,
    value.screenTier,
    `${where}.screenTier`,
  );

  if (value.cvInput === "raw") {
    if (value.parseTier !== undefined) {
      throw new BenchDataError(
        source,
        `${where}: a raw-text configuration has no parseTier`,
      );
    }
    return { name, cvInput: "raw", screenTier };
  }
  if (value.cvInput === "parsed") {
    const parseTier = requireTier(
      source,
      value.parseTier,
      `${where}.parseTier`,
    );
    return { name, cvInput: "parsed", parseTier, screenTier };
  }
  throw new BenchDataError(
    source,
    `${where}.cvInput must be "parsed" or "raw"`,
  );
}

export function loadBenchConfig(path = DEFAULT_CONFIG_PATH): BenchConfig {
  const raw = readJson(path);
  if (!isRecord(raw) || !isRecord(raw.models) || !isRecord(raw.llm)) {
    throw new BenchDataError(path, "expected { sdkVersion, models, llm, ... }");
  }
  if (!Array.isArray(raw.configurations) || raw.configurations.length === 0) {
    throw new BenchDataError(path, "configurations must be a non-empty array");
  }

  const configurations = (raw.configurations as unknown[]).map((c) =>
    parseConfiguration(path, c),
  );
  const names = new Set(configurations.map((c) => c.name));
  if (names.size !== configurations.length) {
    throw new BenchDataError(path, "configuration names must be unique");
  }

  return {
    sdkVersion: requireString(path, raw.sdkVersion, "sdkVersion"),
    models: {
      light: requireString(path, raw.models.light, "models.light"),
      heavy: requireString(path, raw.models.heavy, "models.heavy"),
    },
    llm: {
      temperature: requireNumber(path, raw.llm.temperature, "llm.temperature"),
      maxTokens: requirePositiveInteger(
        path,
        raw.llm.maxTokens,
        "llm.maxTokens",
      ),
      timeoutMs: requirePositiveInteger(
        path,
        raw.llm.timeoutMs,
        "llm.timeoutMs",
      ),
    },
    repeats: requirePositiveInteger(path, raw.repeats, "repeats"),
    transportAttempts: requirePositiveInteger(
      path,
      raw.transportAttempts,
      "transportAttempts",
    ),
    priceList: requireString(path, raw.priceList, "priceList"),
    configurations,
  };
}

export function loadPriceList(path: string): PriceList {
  const raw = readJson(path);
  if (!isRecord(raw) || !isRecord(raw.models)) {
    throw new BenchDataError(
      path,
      "expected { date, source, currency, models }",
    );
  }
  const models: PriceList["models"] = {};
  for (const [model, price] of Object.entries(raw.models)) {
    if (!isRecord(price)) {
      throw new BenchDataError(
        path,
        `models.${model} must be { input, output }`,
      );
    }
    models[model] = {
      input: requireNumber(path, price.input, `models.${model}.input`),
      output: requireNumber(path, price.output, `models.${model}.output`),
    };
  }
  return {
    date: requireString(path, raw.date, "date"),
    source: requireString(path, raw.source, "source"),
    currency: requireString(path, raw.currency, "currency"),
    models,
  };
}

function loadJobs(path: string): BenchJob[] {
  const raw = readJson(path);
  if (!Array.isArray(raw)) {
    throw new BenchDataError(path, "expected an array of jobs");
  }
  const jobs = raw.map((job: unknown): BenchJob => {
    if (!isRecord(job)) {
      throw new BenchDataError(path, "each job must be an object");
    }
    const id = requireString(path, job.id, "job.id");
    const requirements = requireString(
      path,
      job.requirements,
      `job "${id}".requirements`,
    );
    if (splitRequirements(requirements).length === 0) {
      // Production skips screening for a job without requirements.
      throw new BenchDataError(path, `job "${id}" has no requirements`);
    }
    return {
      id,
      title: requireString(path, job.title, `job "${id}".title`),
      requirements,
    };
  });
  assertUniqueIds(path, jobs, "job");
  return jobs;
}

function loadCvs(dir: string): BenchCv[] {
  const files = readdirSync(dir)
    .filter((file) => extname(file).toLowerCase() === ".txt")
    .sort();
  const cvs = files.map((filename): BenchCv => {
    // Production trims extracted text before parse-cv (applications.service.ts).
    const text = readFileSync(join(dir, filename), "utf8").trim();
    if (!text) {
      throw new BenchDataError(join(dir, filename), "CV text is empty");
    }
    return { id: basename(filename, extname(filename)), filename, text };
  });
  if (cvs.length === 0) {
    throw new BenchDataError(dir, "no .txt CVs found");
  }
  return cvs;
}

const LABEL_KEYS: readonly string[] = [
  "cvId",
  "jobId",
  "recommendation",
  "score",
  "labeller",
  "labelledAt",
  "notes",
];

function parseLabel(path: string, value: unknown): HumanLabel {
  if (!isRecord(value)) {
    throw new BenchDataError(path, "each label must be an object");
  }
  const cvId = requireString(path, value.cvId, "label.cvId");
  const jobId = requireString(path, value.jobId, "label.jobId");
  const where = `label ${cvId}/${jobId}`;

  // A misspelt key ("recomendation") would otherwise read as "not labelled"
  // and silently drop a human label from the agreement metrics.
  const unknownKeys = Object.keys(value).filter(
    (key) => !LABEL_KEYS.includes(key),
  );
  if (unknownKeys.length > 0) {
    throw new BenchDataError(
      path,
      `${where}: unknown field(s) ${unknownKeys.join(", ")}; allowed: ${LABEL_KEYS.join(", ")}`,
    );
  }

  const recommendation = value.recommendation ?? null;
  if (
    recommendation !== null &&
    !(RECOMMENDATIONS as readonly unknown[]).includes(recommendation)
  ) {
    throw new BenchDataError(
      path,
      `${where}.recommendation must be one of ${RECOMMENDATIONS.join(", ")} or null`,
    );
  }

  const score = value.score ?? null;
  if (
    score !== null &&
    (typeof score !== "number" ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > 100)
  ) {
    throw new BenchDataError(
      path,
      `${where}.score must be an integer 0-100 or null`,
    );
  }
  if (recommendation === null && score !== null) {
    throw new BenchDataError(
      path,
      `${where}: a score needs a recommendation too`,
    );
  }

  const labeller = value.labeller ?? null;
  const labelledAt = value.labelledAt ?? null;
  if (
    recommendation !== null &&
    (typeof labeller !== "string" || !labeller.trim())
  ) {
    throw new BenchDataError(
      path,
      `${where}: a labelled pair needs a labeller`,
    );
  }

  return {
    cvId,
    jobId,
    recommendation: recommendation as HumanLabel["recommendation"],
    score,
    labeller: typeof labeller === "string" ? labeller : null,
    labelledAt: typeof labelledAt === "string" ? labelledAt : null,
    notes: typeof value.notes === "string" ? value.notes : undefined,
  };
}

function assertUniqueIds(
  source: string,
  items: { id: string }[],
  kind: string,
) {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) {
      throw new BenchDataError(source, `duplicate ${kind} id "${id}"`);
    }
    seen.add(id);
  }
}

export function pairId(cvId: string, jobId: string): string {
  return `${cvId}__${jobId}`;
}

/**
 * Reads `<dir>/jobs.json`, `<dir>/cvs/*.txt` and `<dir>/labels.json`.
 * Every label entry defines one (CV, job) pair, labelled or not.
 */
export function loadDataset(dir = DEFAULT_DATASET_DIR): BenchDataset {
  const root = resolve(dir);
  const jobs = loadJobs(join(root, "jobs.json"));
  const cvs = loadCvs(join(root, "cvs"));
  const labelsPath = join(root, "labels.json");
  const rawLabels = readJson(labelsPath);
  if (!Array.isArray(rawLabels)) {
    throw new BenchDataError(labelsPath, "expected an array of labels");
  }

  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const cvsById = new Map(cvs.map((cv) => [cv.id, cv]));
  const pairs = rawLabels.map((value: unknown): BenchPair => {
    const label = parseLabel(labelsPath, value);
    const cv = cvsById.get(label.cvId);
    const job = jobsById.get(label.jobId);
    if (!cv) {
      throw new BenchDataError(labelsPath, `unknown cvId "${label.cvId}"`);
    }
    if (!job) {
      throw new BenchDataError(labelsPath, `unknown jobId "${label.jobId}"`);
    }
    return { id: pairId(cv.id, job.id), cv, job, label };
  });
  assertUniqueIds(labelsPath, pairs, "pair");
  if (pairs.length === 0) {
    throw new BenchDataError(labelsPath, "no pairs defined");
  }

  return { dir: root, jobs, cvs, pairs };
}
