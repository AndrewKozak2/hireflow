import { VERSION as SDK_VERSION } from "@anthropic-ai/sdk/version";
import { Logger } from "@nestjs/common";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { executeRun, regenerateReport } from "./bench";
import { createFakeMessagesApi } from "./fake-anthropic";
import {
  BENCH_DIR,
  loadBenchConfig,
  loadDataset,
  loadPriceList,
} from "./loaders";
import { CALLS_FILE, META_FILE, REPORT_FILE } from "./results";
import { BenchDataset, RECOMMENDATIONS } from "./types";

/**
 * Fixture labels so every metric has something to compute in the dry run.
 * They are assigned round-robin and are NOT ground truth: real labels come from
 * a human (see LABELLING.md).
 */
function withFixtureLabels(dataset: BenchDataset): BenchDataset {
  return {
    ...dataset,
    pairs: dataset.pairs.map((pair, index) => ({
      ...pair,
      label: {
        ...pair.label,
        recommendation: RECOMMENDATIONS[index % 3],
        score: [25, 60, 85][index % 3],
        labeller: "dry-run-fixture",
        labelledAt: "2026-11-02",
      },
    })),
  };
}

describe("AI screening bench — dry run on the fake client", () => {
  let resultsDir: string;

  // LlmClientService logs every call; jest isolates modules per file, so this stays local.
  beforeAll(() => {
    Logger.overrideLogger(false);
  });
  beforeEach(() => {
    resultsDir = mkdtempSync(join(tmpdir(), "bench-results-"));
  });
  afterEach(() => rmSync(resultsDir, { recursive: true, force: true }));

  it("runs the whole pipeline and writes the CSV, metadata and report", async () => {
    const config = loadBenchConfig();
    const prices = loadPriceList(resolve(BENCH_DIR, config.priceList));
    const dataset = withFixtureLabels(loadDataset());
    const api = createFakeMessagesApi();
    const sleep = jest.fn(() => Promise.resolve());

    const result = await executeRun({
      dataset,
      config,
      prices,
      api,
      dryRun: true,
      resultsDir,
      runId: "dry-run-spec",
      sleep,
    });

    // Files
    expect(result.dir).toBe(join(resultsDir, "dry-run-spec"));
    for (const file of [CALLS_FILE, META_FILE, REPORT_FILE]) {
      expect(existsSync(join(result.dir, file))).toBe(true);
    }

    // Every request went through the injected client: one fake call per attempt.
    const attempts = result.rows.reduce((sum, r) => sum + r.attempts, 0);
    expect(api.calls).toBe(attempts);

    // Shape: per repeat, one parse per CV and one screening per pair × configuration.
    const parses = result.rows.filter((r) => r.task === "parse-cv");
    const screenings = result.rows.filter((r) => r.task !== "parse-cv");
    const cvsInPairs = new Set(dataset.pairs.map((p) => p.cv.id)).size;
    expect(parses).toHaveLength(cvsInPairs * config.repeats);
    expect(screenings).toHaveLength(
      dataset.pairs.length * config.configurations.length * config.repeats,
    );

    // The configurations that parse share the parse; the ablation has none.
    for (const row of screenings) {
      if (row.task === "ai-screening-raw-cv") {
        expect(row.dependsOn).toBe("");
      } else {
        const parse = parses.find((p) => p.callId === row.dependsOn);
        expect(parse).toMatchObject({
          cvId: row.cvId,
          repeat: row.repeat,
          tier: "light",
        });
      }
    }

    // The scripted faults cover retries, every answer-level failure and a skipped screening.
    const statuses = new Set(result.rows.map((r) => r.status));
    for (const status of [
      "ok",
      "invalid_json",
      "schema_invalid",
      "empty",
      "skipped",
    ]) {
      expect(statuses).toContain(status);
    }
    expect(result.rows.some((r) => r.attempts === 2 && r.status === "ok")).toBe(
      true,
    );
    expect(sleep).toHaveBeenCalledTimes(1);

    // Per-call record
    for (const row of result.rows.filter((r) => r.status !== "skipped")) {
      expect(row.sdkVersion).toBe(SDK_VERSION);
      expect(row.modelRequested).toBe(config.models[row.tier]);
      expect(row.modelResponded).toBe(row.modelRequested);
      expect(row.inputTokens).toBeGreaterThan(0);
      expect(row.costUsd).toBeGreaterThan(0);
      expect(row.latencyMs).not.toBeNull();
    }
    const heavy = screenings.filter(
      (r) => r.configuration === "heavy" && r.status === "ok",
    );
    expect(
      heavy.every(
        (r) =>
          r.tier === "heavy" &&
          r.recommendation !== null &&
          r.matchPercentage !== null,
      ),
    ).toBe(true);

    // Report: built from the CSV, and rebuilding it gives the same text.
    expect(result.report).toContain("**Dry run.**");
    for (const configuration of config.configurations) {
      expect(result.report).toContain(`### ${configuration.name}`);
    }
    expect(result.report).toContain(`Price list | ${prices.date}`);
    expect(regenerateReport(result.dir).report).toBe(
      readFileSync(join(result.dir, REPORT_FILE), "utf8"),
    );
    expect(result.meta.dataset.labelledPairs).toBe(dataset.pairs.length);
  });

  it("stops starting new calls once the cost limit is reached", async () => {
    const config = loadBenchConfig();
    const prices = loadPriceList(resolve(BENCH_DIR, config.priceList));

    const result = await executeRun({
      dataset: loadDataset(),
      config,
      prices,
      api: createFakeMessagesApi({}),
      dryRun: true,
      resultsDir,
      runId: "budget",
      maxCostUsd: 0.001,
    });

    expect(result.meta.aborted).toContain("reached the limit");
    const spent = result.rows.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
    expect(spent).toBeGreaterThanOrEqual(0.001);
    // Only the call that crossed the limit can overshoot it.
    expect(
      spent - (result.rows[result.rows.length - 1].costUsd ?? 0),
    ).toBeLessThan(0.001);
    expect(result.report).toContain("reached the limit");
  });
});
