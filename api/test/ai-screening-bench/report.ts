import {
  accuracy,
  answerStability,
  confusionMatrix,
  mean,
  percentile,
  scoreSpread,
  spearman,
  weightedKappa,
} from "./metrics";
import {
  BenchConfiguration,
  CallRow,
  CallStatus,
  RECOMMENDATIONS,
  RunMeta,
} from "./types";

const INVALID_STATUSES: CallStatus[] = [
  "invalid_json",
  "schema_invalid",
  "empty",
];
const STATUS_COLUMNS: CallStatus[] = [
  "ok",
  "invalid_json",
  "schema_invalid",
  "empty",
  "timeout",
  "api_error",
];

function fmt(value: number | null, digits = 2): string {
  return value === null || Number.isNaN(value) ? "—" : value.toFixed(digits);
}

function pct(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function seconds(ms: number | null): string {
  return ms === null ? "—" : (ms / 1000).toFixed(2);
}

function table(header: string[], rows: string[][]): string {
  return [
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

export interface ConfigurationSummary {
  configuration: BenchConfiguration;
  attempted: number;
  ok: number;
  skipped: number;
  labelled: number;
  matrix: number[][];
  accuracy: number | null;
  kappaUnweighted: number | null;
  kappaLinear: number | null;
  kappaQuadratic: number | null;
  spearman: number | null;
  spearmanN: number;
  stability: ReturnType<typeof answerStability>;
  spread: ReturnType<typeof scoreSpread>;
  meanCostUsd: number | null;
  meanInputTokens: number | null;
  meanOutputTokens: number | null;
  screeningLatencyP50: number | null;
  screeningLatencyP95: number | null;
  endToEndLatencyP50: number | null;
  endToEndLatencyP95: number | null;
}

export function summarizeConfiguration(
  configuration: BenchConfiguration,
  rows: CallRow[],
): ConfigurationSummary {
  const byId = new Map(rows.map((row) => [row.callId, row]));
  const screenings = rows.filter(
    (r) => r.configuration === configuration.name && r.task !== "parse-cv",
  );
  const attempted = screenings.filter((r) => r.status !== "skipped");
  const ok = screenings.filter(
    (r) => r.status === "ok" && r.recommendation !== null,
  );

  const labelled = ok.filter((r) => r.humanRecommendation !== null);
  const matrix = confusionMatrix(
    RECOMMENDATIONS,
    labelled.map((r) => ({
      reference: r.humanRecommendation!,
      predicted: r.recommendation!,
    })),
  );

  const scored = ok.filter(
    (r) => r.humanScore !== null && r.matchPercentage !== null,
  );
  const byPair = [...groupBy(ok, (r) => r.pairId).values()];

  // A screening's cost and latency include the parse-cv call it used.
  const parseOf = (row: CallRow) =>
    row.dependsOn ? byId.get(row.dependsOn) : undefined;
  // Cost per screening covers every screening, failed or skipped: a call
  // without usage (timeout, API error, skipped) cost nothing itself, but the
  // parse it relied on was still paid for. Null = a model had no price.
  const billed = (row: CallRow | undefined): number | null =>
    !row || row.inputTokens === null ? 0 : row.costUsd;
  const costs = screenings.map((r) => {
    const own = billed(r);
    const parse = billed(parseOf(r));
    return own === null || parse === null ? null : own + parse;
  });
  const screeningLatencies = ok
    .map((r) => r.latencyMs)
    .filter((l): l is number => l !== null);
  const endToEnd = ok
    .map((r) =>
      r.latencyMs === null ? null : r.latencyMs + (parseOf(r)?.latencyMs ?? 0),
    )
    .filter((l): l is number => l !== null);

  return {
    configuration,
    attempted: attempted.length,
    ok: ok.length,
    skipped: screenings.length - attempted.length,
    labelled: labelled.length,
    matrix,
    accuracy: accuracy(matrix),
    kappaUnweighted: weightedKappa(matrix, "none"),
    kappaLinear: weightedKappa(matrix, "linear"),
    kappaQuadratic: weightedKappa(matrix, "quadratic"),
    spearman: spearman(
      scored.map((r) => r.matchPercentage!),
      scored.map((r) => r.humanScore!),
    ),
    spearmanN: scored.length,
    stability: answerStability(
      byPair.map((group) => group.map((r) => r.recommendation!)),
    ),
    spread: scoreSpread(
      byPair.map((group) => group.map((r) => r.matchPercentage!)),
    ),
    meanCostUsd: costs.includes(null) ? null : mean(costs as number[]),
    meanInputTokens: mean(
      attempted
        .map((r) => r.inputTokens)
        .filter((t): t is number => t !== null),
    ),
    meanOutputTokens: mean(
      attempted
        .map((r) => r.outputTokens)
        .filter((t): t is number => t !== null),
    ),
    screeningLatencyP50: percentile(screeningLatencies, 0.5),
    screeningLatencyP95: percentile(screeningLatencies, 0.95),
    endToEndLatencyP50: percentile(endToEnd, 0.5),
    endToEndLatencyP95: percentile(endToEnd, 0.95),
  };
}

function warnings(rows: CallRow[], meta: RunMeta): string[] {
  const notes: string[] = [];
  const sdkVersions = new Set(rows.map((r) => r.sdkVersion));
  if (sdkVersions.size > 1) {
    notes.push(
      `Rows were recorded with more than one SDK version: ${[...sdkVersions].join(", ")}.`,
    );
  }
  const mismatched = rows.filter(
    (r) => r.modelResponded && r.modelResponded !== r.modelRequested,
  );
  if (mismatched.length > 0) {
    const examples = [
      ...new Set(
        mismatched.map((r) => `${r.modelRequested} → ${r.modelResponded}`),
      ),
    ];
    notes.push(
      `${mismatched.length} responses came from a different model id than requested: ${examples.join("; ")}.`,
    );
  }
  const unpriced = rows.filter(
    (r) => r.inputTokens !== null && r.costUsd === null,
  );
  if (unpriced.length > 0) {
    const models = [...new Set(unpriced.map((r) => r.modelRequested))];
    notes.push(
      `No price for ${models.join(", ")} in the ${meta.priceList.date} price list; their cost is left out.`,
    );
  }
  if (meta.dataset.labelledPairs < meta.dataset.pairs) {
    notes.push(
      `${meta.dataset.pairs - meta.dataset.labelledPairs} of ${meta.dataset.pairs} pairs have no human label; they count for stability, cost and latency, not for agreement.`,
    );
  }
  if (meta.aborted) notes.push(meta.aborted);
  return notes;
}

/** Builds the Markdown report from the rows of calls.csv and the run's metadata. */
export function buildReport(rows: CallRow[], meta: RunMeta): string {
  const summaries = meta.configurations.map((c) =>
    summarizeConfiguration(c, rows),
  );
  const describe = (c: BenchConfiguration) =>
    c.cvInput === "raw"
      ? `raw CV text → screening (${c.screenTier})`
      : `parse-cv (${c.parseTier}) → screening (${c.screenTier})`;

  const sections: string[] = [];
  sections.push(`# AI screening bench — ${meta.runId}`);
  if (meta.dryRun) {
    sections.push(
      "> **Dry run.** Answers come from a deterministic fake client, not a model. The numbers below only show that the pipeline and the report work; they say nothing about screening quality.",
    );
  }

  sections.push(
    "## Run",
    table(
      ["", ""],
      [
        ["Started / finished", `${meta.startedAt} / ${meta.finishedAt}`],
        ["`@anthropic-ai/sdk`", meta.sdkVersion],
        [
          "Models",
          `light: \`${meta.models.light}\`, heavy: \`${meta.models.heavy}\``,
        ],
        [
          "Price list",
          `${meta.priceList.date} (${meta.priceList.currency}), ${meta.priceList.source}`,
        ],
        ["Repeats per pair", String(meta.repeats)],
        [
          "Dataset",
          `${meta.dataset.jobs} jobs, ${meta.dataset.cvs} CVs, ${meta.dataset.pairs} pairs (${meta.dataset.labelledPairs} labelled)`,
        ],
        [
          "Calls recorded",
          String(rows.filter((r) => r.status !== "skipped").length),
        ],
        [
          "Total cost",
          `$${fmt(
            rows.reduce((sum, r) => sum + (r.costUsd ?? 0), 0),
            4,
          )}`,
        ],
      ],
    ),
  );

  const notes = warnings(rows, meta);
  if (notes.length > 0) {
    sections.push("## Warnings", notes.map((n) => `- ${n}`).join("\n"));
  }

  sections.push(
    "## Agreement with human labels",
    "Each successful screening counts as one observation, so a pair contributes once per repeat. κ is Cohen's kappa over the ordered classes reject < review < proceed.",
    table(
      [
        "Configuration",
        "Pipeline",
        "OK / attempted",
        "Labelled",
        "Accuracy",
        "κ",
        "κ linear",
        "κ quadratic",
        "Spearman ρ (n)",
      ],
      summaries.map((s) => [
        s.configuration.name,
        describe(s.configuration),
        `${s.ok} / ${s.attempted}${s.skipped ? ` (+${s.skipped} skipped)` : ""}`,
        String(s.labelled),
        pct(s.accuracy),
        fmt(s.kappaUnweighted),
        fmt(s.kappaLinear),
        fmt(s.kappaQuadratic),
        `${fmt(s.spearman)} (${s.spearmanN})`,
      ]),
    ),
  );

  sections.push(
    "## Stability across repeats",
    table(
      [
        "Configuration",
        "Pairs with ≥2 answers",
        "Same recommendation",
        "Unanimous pairs",
        "Mean score range",
        "Mean score SD",
      ],
      summaries.map((s) => [
        s.configuration.name,
        String(s.stability.groups),
        pct(s.stability.modalAgreement),
        pct(s.stability.unanimousShare),
        fmt(s.spread.meanRange, 1),
        fmt(s.spread.meanStdDev, 1),
      ]),
    ),
  );

  sections.push(
    "## Cost and latency",
    `Cost uses the ${meta.priceList.date} price list. Cost per screening is averaged over every screening of the configuration, including failed and skipped ones, and includes the parse-cv call it relied on. The bench shares one parse between configurations and jobs, but each screening is charged for it in full, as if every screening parsed its own CV the way production does per application — so these figures are per-screening costs, not the run's actual spend (see Total cost). End-to-end latency is screening plus its parse.`,
    table(
      [
        "Configuration",
        "Cost / screening (USD)",
        "Per 1,000 screenings (USD)",
        "Mean tokens in / out (screening)",
        "Screening p50 / p95 (s)",
        "End to end p50 / p95 (s)",
      ],
      summaries.map((s) => [
        s.configuration.name,
        fmt(s.meanCostUsd, 5),
        fmt(s.meanCostUsd === null ? null : s.meanCostUsd * 1000, 2),
        `${fmt(s.meanInputTokens, 0)} / ${fmt(s.meanOutputTokens, 0)}`,
        `${seconds(s.screeningLatencyP50)} / ${seconds(s.screeningLatencyP95)}`,
        `${seconds(s.endToEndLatencyP50)} / ${seconds(s.endToEndLatencyP95)}`,
      ]),
    ),
  );

  const calls = rows.filter((r) => r.status !== "skipped");
  const byTaskTier = groupBy(calls, (r) => `${r.task}|${r.tier}`);
  sections.push(
    "## Errors",
    "Invalid share = invalid JSON, schema-invalid or empty answers, out of the calls that got an answer (timeouts and API errors are counted separately). `attempts` > 1 means the bench retried a timeout or API error.",
    table(
      ["Task", "Tier", "Calls", ...STATUS_COLUMNS, "Invalid share", "Retried"],
      [...byTaskTier.entries()].map(([key, group]) => {
        const [task, tier] = key.split("|");
        const count = (status: CallStatus) =>
          group.filter((r) => r.status === status).length;
        const answered = group.filter(
          (r) => r.status !== "timeout" && r.status !== "api_error",
        ).length;
        const invalid = INVALID_STATUSES.reduce((sum, s) => sum + count(s), 0);
        return [
          task,
          tier,
          String(group.length),
          ...STATUS_COLUMNS.map((s) => String(count(s))),
          pct(answered === 0 ? null : invalid / answered),
          String(group.filter((r) => r.attempts > 1).length),
        ];
      }),
    ),
  );

  sections.push(
    "## Confusion matrices",
    "Rows: human label. Columns: model answer.",
  );
  for (const s of summaries) {
    sections.push(
      `### ${s.configuration.name}`,
      table(
        ["human \\ model", ...RECOMMENDATIONS],
        RECOMMENDATIONS.map((label, i) => [label, ...s.matrix[i].map(String)]),
      ),
    );
  }

  sections.push(
    "## Definitions",
    "See `test/ai-screening-bench/README.md` for what each metric means and how it is computed.",
  );

  return `${sections.join("\n\n")}\n`;
}
