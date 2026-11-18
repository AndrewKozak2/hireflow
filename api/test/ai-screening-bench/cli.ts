import Anthropic from "@anthropic-ai/sdk";
import { VERSION as SDK_VERSION } from "@anthropic-ai/sdk/version";
import { Logger } from "@nestjs/common";
import { parse as parseDotenv } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { executeRun, regenerateReport } from "./bench";
import { describePlan, planRun } from "./estimate";
import { createFakeMessagesApi } from "./fake-anthropic";
import type { MessagesApi } from "./instrumented-llm";
import {
  BENCH_DIR,
  DEFAULT_CONFIG_PATH,
  DEFAULT_DATASET_DIR,
  loadBenchConfig,
  loadDataset,
  loadPriceList,
} from "./loaders";
import type { CallRow } from "./types";

const USAGE = `AI screening bench (see test/ai-screening-bench/README.md)

  npm run bench:screening                       print the plan and cost estimate, call nothing
  npm run bench:screening -- --dry-run          run everything on a fake client (no API calls)
  npm run bench:screening -- --live             print the plan for a real run, call nothing
  npm run bench:screening -- --live --confirm   real API calls (spends money)
  npm run bench:screening -- report <run-dir>   rebuild report.md from calls.csv

Options:
  --dataset <dir>          default: test/ai-screening-bench/data
  --config <file>          default: test/ai-screening-bench/bench.config.json
  --configurations a,b     subset of the configurations in the config file
  --repeats <n>            default: from the config file
  --results <dir>          default: test/ai-screening-bench/results
  --max-cost-usd <x>       live only; default: the plan's upper bound
  --env <file>             live only; where to read LLM_API_KEY if it is not in the environment (default: api/.env)
`;

interface Args {
  flags: Set<string>;
  values: Map<string, string>;
  positional: string[];
}

const VALUE_OPTIONS = new Set([
  "--dataset",
  "--config",
  "--configurations",
  "--repeats",
  "--results",
  "--max-cost-usd",
  "--env",
]);
const FLAG_OPTIONS = new Set(["--dry-run", "--live", "--confirm", "--help"]);

function parseArgs(argv: string[]): Args {
  const args: Args = { flags: new Set(), values: new Map(), positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (FLAG_OPTIONS.has(arg)) {
      args.flags.add(arg);
    } else if (VALUE_OPTIONS.has(arg)) {
      const value = argv[i + 1];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      args.values.set(arg, value);
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option ${arg}`);
    } else {
      args.positional.push(arg);
    }
  }
  return args;
}

function readApiKey(envPath: string): string {
  if (process.env.LLM_API_KEY) return process.env.LLM_API_KEY;
  // Parsed into a local value, not loaded into process.env.
  const key = existsSync(envPath)
    ? parseDotenv(readFileSync(envPath)).LLM_API_KEY
    : undefined;
  if (!key)
    throw new Error(`LLM_API_KEY is not set and not found in ${envPath}`);
  return key;
}

function printRow(row: CallRow): void {
  const latency =
    row.latencyMs === null ? "" : ` ${(row.latencyMs / 1000).toFixed(2)}s`;
  const retried = row.attempts > 1 ? ` (${row.attempts} attempts)` : "";
  console.log(
    `${row.callId} r${row.repeat} ${row.configuration || "-"} ${row.task} ${row.cvId}${row.jobId ? `/${row.jobId}` : ""} ${row.status}${latency}${retried}`,
  );
}

async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  if (args.flags.has("--help")) {
    console.log(USAGE);
    return 0;
  }

  if (args.positional[0] === "report") {
    const dir = args.positional[1];
    if (!dir) throw new Error("report needs a run directory");
    regenerateReport(resolve(dir));
    console.log(`Wrote ${join(resolve(dir), "report.md")}`);
    return 0;
  }
  if (args.positional.length > 0)
    throw new Error(`Unknown command ${args.positional[0]}`);

  const dryRun = args.flags.has("--dry-run");
  const live = args.flags.has("--live");
  if (dryRun && live) throw new Error("Choose --dry-run or --live, not both");

  const configPath = resolve(
    args.values.get("--config") ?? DEFAULT_CONFIG_PATH,
  );
  const config = loadBenchConfig(configPath);
  const prices = loadPriceList(resolve(BENCH_DIR, config.priceList));
  const dataset = loadDataset(
    args.values.get("--dataset") ?? DEFAULT_DATASET_DIR,
  );

  const wanted = args.values
    .get("--configurations")
    ?.split(",")
    .map((s) => s.trim());
  const configurations = wanted
    ? wanted.map((name) => {
        const found = config.configurations.find((c) => c.name === name);
        if (!found)
          throw new Error(`No configuration "${name}" in ${configPath}`);
        return found;
      })
    : config.configurations;
  const repeatsArg = args.values.get("--repeats");
  const repeats =
    repeatsArg === undefined ? config.repeats : Number(repeatsArg);
  if (!Number.isInteger(repeats) || repeats < 1)
    throw new Error("--repeats must be a positive integer");

  const plan = planRun(dataset, config, prices, configurations, repeats);
  const labelled = dataset.pairs.filter(
    (p) => p.label.recommendation !== null,
  ).length;
  console.log(
    `Dataset: ${dataset.dir} — ${dataset.pairs.length} pairs, ${labelled} labelled`,
  );
  console.log(
    `Configurations: ${configurations.map((c) => c.name).join(", ")}`,
  );
  console.log(describePlan(plan, prices));

  if (!dryRun && !live) {
    console.log(
      "\nNothing called. Add --dry-run to run on the fake client, or --live to prepare a real run.",
    );
    return 0;
  }

  let api: MessagesApi;
  let maxCostUsd: number | undefined;
  if (live) {
    if (!args.flags.has("--confirm")) {
      console.log(
        "\nNothing called. A real run spends money: re-run with --live --confirm once it is approved.",
      );
      return 0;
    }
    if (SDK_VERSION !== config.sdkVersion) {
      throw new Error(
        `@anthropic-ai/sdk is ${SDK_VERSION}, but the bench is pinned to ${config.sdkVersion}. Restore the pinned version (npm ci) or change the pin deliberately.`,
      );
    }
    // The cost limit counts only priced calls, so an unpriced model would run
    // unbounded: refuse rather than accept --max-cost-usd for it.
    const unpriced = plan.byModel
      .filter((m) => m.maxCostUsd === null)
      .map((m) => m.model);
    if (unpriced.length > 0 || plan.maxCostUsd === null) {
      throw new Error(
        `No price for ${unpriced.join(", ")} in ${config.priceList}; add it before a live run`,
      );
    }
    const maxCostArg = args.values.get("--max-cost-usd");
    maxCostUsd =
      maxCostArg === undefined ? plan.maxCostUsd : Number(maxCostArg);
    if (!Number.isFinite(maxCostUsd) || maxCostUsd <= 0) {
      throw new Error("--max-cost-usd must be a positive number");
    }
    const client = new Anthropic({
      apiKey: readApiKey(
        resolve(
          args.values.get("--env") ?? join(BENCH_DIR, "..", "..", ".env"),
        ),
      ),
    });
    api = { create: (body, options) => client.messages.create(body, options) };
    console.log(
      `\nLive run, stopping if recorded cost reaches $${maxCostUsd.toFixed(2)}.`,
    );
  } else {
    api = createFakeMessagesApi();
    console.log("\nDry run on the fake client.");
  }

  // LlmClientService logs every call at "log" level; keep the bench output readable.
  Logger.overrideLogger(["error", "warn"]);
  const result = await executeRun({
    dataset,
    config,
    prices,
    api,
    configurations,
    repeats,
    maxCostUsd,
    dryRun,
    resultsDir: resolve(
      args.values.get("--results") ?? join(BENCH_DIR, "results"),
    ),
    sleep: dryRun ? () => Promise.resolve() : undefined,
    onRow: printRow,
  });

  const spent = result.rows.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
  console.log(
    `\nRecorded ${result.rows.length} rows, $${spent.toFixed(4)}. Results in ${result.dir}`,
  );
  if (result.meta.aborted) {
    console.log(result.meta.aborted);
    return 1;
  }
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    console.error(`\n${USAGE}`);
    process.exitCode = 1;
  },
);
