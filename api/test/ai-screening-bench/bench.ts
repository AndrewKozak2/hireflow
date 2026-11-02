import { VERSION as SDK_VERSION } from "@anthropic-ai/sdk/version";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { buildReport } from "./report";
import { readRunFiles, REPORT_FILE, writeRunFiles } from "./results";
import { RunOptions, runBench } from "./runner";
import type { CallRow, RunMeta } from "./types";

export interface ExecuteOptions extends RunOptions {
  dryRun: boolean;
  /** The run writes into `<resultsDir>/<runId>/`. */
  resultsDir: string;
  runId?: string;
}

export interface ExecuteResult {
  dir: string;
  meta: RunMeta;
  rows: CallRow[];
  report: string;
}

/**
 * Runs the bench, writes calls.csv and run.json, then builds report.md from
 * what was written — so the report always reflects the CSV, never in-memory state.
 */
export async function executeRun(
  options: ExecuteOptions,
): Promise<ExecuteResult> {
  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const runId =
    options.runId ??
    `${startedAt.toISOString().replace(/[:.]/g, "-")}${options.dryRun ? "-dry" : ""}`;
  const dir = join(options.resultsDir, runId);
  mkdirSync(dir, { recursive: true });

  const { rows, aborted } = await runBench(options);

  const meta: RunMeta = {
    runId,
    dryRun: options.dryRun,
    startedAt: startedAt.toISOString(),
    finishedAt: now().toISOString(),
    sdkVersion: SDK_VERSION,
    models: options.config.models,
    priceList: {
      date: options.prices.date,
      source: options.prices.source,
      currency: options.prices.currency,
    },
    repeats: options.repeats ?? options.config.repeats,
    configurations: options.configurations ?? options.config.configurations,
    dataset: {
      dir: options.dataset.dir,
      jobs: options.dataset.jobs.length,
      cvs: options.dataset.cvs.length,
      pairs: options.dataset.pairs.length,
      labelledPairs: options.dataset.pairs.filter(
        (p) => p.label.recommendation !== null,
      ).length,
    },
    aborted,
  };
  writeRunFiles(dir, rows, meta);

  return { dir, ...regenerateReport(dir) };
}

/** Rebuilds report.md from calls.csv and run.json in `dir`. */
export function regenerateReport(dir: string): Omit<ExecuteResult, "dir"> {
  const { rows, meta } = readRunFiles(dir);
  const report = buildReport(rows, meta);
  writeFileSync(join(dir, REPORT_FILE), report, "utf8");
  return { meta, rows, report };
}
