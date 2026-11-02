# AI screening evaluation bench

A reproducible bench for the AI screening pipeline in `api/src/llm/`. It measures how well screening
decisions agree with human labels, how stable they are across repeated runs, and what they cost in
money and time on the light and heavy model tiers.

The pipeline under test is the production one:

1. `parse-cv` (`src/llm/tasks/parse-cv`) turns CV text into a structured candidate profile.
2. `ai-screening` (`src/llm/tasks/ai-screening`) reads the profile and the job's requirements and returns
   `matchPercentage` (0–100), `recommendation` (`proceed | review | reject`), a summary and skills.

The bench writes nothing to the application database and changes no production code.

## Layout

| Path | What |
|---|---|
| `data/jobs.json` | Jobs: `id`, `title`, `requirements` (one per line, as stored in the database). |
| `data/cvs/*.txt` | Synthetic CVs, plain text; the file name (without `.txt`) is the CV id. |
| `data/labels.json` | One entry per (CV, job) pair, with the human label. See [LABELLING.md](LABELLING.md). |
| `bench.config.json` | Pinned SDK version and model ids, LLM settings, repeats, configurations. The `llm.temperature` / `llm.maxTokens` values are only fallbacks: each task's own settings win, so screening runs at temperature 0.1 / 700 tokens and parse-cv at 0 / 1200. `llm.timeoutMs` does apply. |
| `prices/<date>.json` | Price list used for cost, with its date and source. |
| `results/<run-id>/` | Output of each run (git-ignored): `calls.csv`, `run.json`, `report.md`. |
| `*.spec.ts` | Unit tests for the metrics, CSV, loaders and ablation task, plus the dry run. |

## Running

All commands run from `api/`.

```bash
npm run bench:screening                        # plan + cost estimate; calls nothing
npm run bench:screening -- --dry-run           # whole pipeline on a fake client; calls nothing
npm run bench:screening -- --live              # plan for a real run; calls nothing
npm run bench:screening -- --live --confirm    # real API calls
npm run bench:screening -- report test/ai-screening-bench/results/<run-id>   # rebuild report.md from calls.csv
```

Options: `--dataset <dir>`, `--configurations heavy,light`, `--repeats <n>`, `--results <dir>`,
`--max-cost-usd <x>`, `--env <file>`, `--config <file>`.

**Dry run.** Uses a deterministic fake Anthropic client. It still goes through the real
`LlmClientService`, prompts, JSON parsing and schemas. The fake also injects one timeout (which then
succeeds on retry), an invalid-JSON answer, a schema-invalid answer and an empty parse answer, so
retries, every answer-level failure and skipped screenings get exercised. A call that still fails
after all retries (final `timeout` / `api_error`) is not part of the dry run. CI runs the same flow as a jest spec (`dry-run.spec.ts`) inside
`npm test`. Dry-run numbers mean nothing about screening quality.

**Real run.** Real calls cost money and are made only after an explicit decision to spend it.
- Without `--confirm`, `--live` only prints the plan: the number of calls per model and an upper-bound
  cost. The bound assumes 2 characters per token and every answer reaching `maxTokens`, so it overstates
  real usage several times over.
- `--live --confirm` refuses to start if the installed `@anthropic-ai/sdk` differs from
  `sdkVersion` in `bench.config.json`, or if any model it would call has no price in the price list,
  because the cost limit can only count priced calls.
- It stops starting new calls once the recorded cost reaches `--max-cost-usd`. The default limit is the
  plan's upper bound.
- `LLM_API_KEY` is read from the environment or from `api/.env`. It is used only for this client and
  is not loaded into the process environment.

## How a run works

- **Configurations** (`bench.config.json`):
  - `heavy`: parse on light, screen on heavy. This is the production setup.
  - `light`: everything on the light model.
  - `raw-heavy`: the ablation. Screening on heavy reads the raw CV text instead of the parsed profile,
    which shows how much information is lost at the parse step.
- **Ablation prompt.** `raw-cv-screening.task.ts` takes the production screening prompt unchanged up to
  `=== CANDIDATE RESUME ===` and puts the raw CV after it. Tier, temperature, `maxTokens` and the
  schema are inherited, so the parsed profile is the only difference. A spec fails if the production
  prompt stops having that marker exactly once.
- **Shared parse.** Within a repeat, each CV is parsed once per parse tier, and that parse is used by
  every configuration and job that needs it.
  - `heavy` and `light` therefore screen the *same* parsed CV, so a difference between them comes from
    the screening model, not from parse noise (a paired comparison).
  - Each repeat parses again, so stability is end to end.
  - A screening's cost and latency include the parse it used.
- **Repeats.** Each pair is run `repeats` times (default 3) in every configuration.
- **Calls.** Calls run one at a time, so concurrency doesn't distort latency.
  - The SDK's own retries are off, so a measured latency is one request.
  - On a timeout or a retryable API error (connection, 408, 409, 429, 5xx), the bench retries up to
    `transportAttempts` times. The `attempts` column records how many attempts a call took.
- **Recording without changing production code.** The bench builds a real `LlmClientService`. Every
  setting goes into its config, because internal config wins over `process.env`, so a local `.env`
  can't change the models. The bench then sets the service's lazily created Anthropic client to a
  recording wrapper. If a request doesn't go through the wrapper (for example, the private field was
  renamed), the call fails loudly instead of measuring something else.
- **Parity glue.** Two steps live inline in `applications.service.ts` rather than in the tasks, and the
  bench copies them: CV text is cut at 40,000 characters, and requirements are split per line, trimmed,
  with empty lines dropped. If production changes either step, update `runner.ts` / `loaders.ts`.

## What is recorded (`calls.csv`)

There is one row per LLM call, plus one row per screening skipped because its parse failed.

| Column | Meaning |
|---|---|
| `call_id`, `repeat`, `configuration`, `task` | Which call it was. `configuration` is empty for parse-cv rows, because a parse is shared. |
| `pair_id`, `cv_id`, `job_id` | The pair; parse rows have only `cv_id`. |
| `tier`, `model_requested`, `model_responded`, `sdk_version` | What was asked for and what answered. |
| `status` | `ok`, `invalid_json`, `schema_invalid`, `empty`, `timeout`, `api_error`, `skipped`. |
| `attempts` | Transport attempts (1 = no retry). |
| `input_tokens`, `output_tokens`, `cost_usd` | From the API's `usage` and the dated price list. |
| `latency_ms` | Wall-clock time of the final attempt's request. |
| `depends_on` | The parse-cv call a screening used. |
| `match_percentage`, `recommendation` | The model's answer (valid screenings only). |
| `human_recommendation`, `human_score` | The label at run time. |
| `stop_reason`, `error`, `raw_text`, `started_at` | For inspecting failures. |

`run.json` holds the run's metadata: models, SDK version, price-list date, configurations, dataset
size, and whether the run was a dry run or was stopped by the cost limit. `report.md` is built from
`calls.csv` and `run.json` only.

## Metrics

Agreement metrics use valid screenings of labelled pairs. Every repeat counts as one observation, so
`n` = labelled pairs × valid repeats.

- **Accuracy**: the share of screenings whose recommendation equals the human one.
- **Confusion matrix**: rows are the human label, columns are the model answer. It shows *which* way the
  model errs, e.g. too lenient (human `reject`, model `review`) or too strict.
- **Cohen's κ (kappa)**: agreement corrected for chance. It is `1 − observed disagreement / disagreement
  expected by chance`, where chance comes from how often each side uses each class.
  - 1 means perfect agreement, 0 means no better than chance, and a negative value means worse than
    chance.
  - The classes are ordered (`reject < review < proceed`), so the report gives three variants:
    - **unweighted κ**: every disagreement counts the same.
    - **linear κ**: `reject` vs `proceed` counts twice as much as a one-step miss.
    - **quadratic κ**: it counts four times as much.
  - A common rough reading is 0.21–0.40 fair, 0.41–0.60 moderate, 0.61–0.80 substantial and above 0.80
    almost perfect (Landis & Koch).
- **Spearman ρ**: rank correlation between `matchPercentage` and the human score, computed over
  screenings of pairs that have a human score. It asks whether the model *orders* candidates the way
  the human does, regardless of the absolute numbers. Ties get average ranks.
- **Stability** is computed per pair across its valid repeats:
  - **Same recommendation**: the mean share of answers equal to that pair's most frequent answer.
  - **Unanimous pairs**: the share of pairs where every repeat agreed.
  - **Mean score range / SD**: the spread of `matchPercentage` across repeats (max − min, and sample
    standard deviation), averaged over pairs.
- **Cost per screening**: the mean, over every screening of a configuration (including failed and
  skipped ones), of its own `cost_usd` plus the cost of the parse-cv call it relied on. A call with no
  usage (timeout, API error, skipped) adds nothing itself, but a parse that was paid for and then failed
  is still charged. Each screening is charged its parse in full even though the bench shares one parse,
  as if each screening parsed its own CV the way production does per application. So this is a
  per-screening cost, not the run's actual spend, which is "Total cost". Per 1,000 screenings = × 1,000.
  The report states the price list's date and source.
- **Latency**: p50 and p95 of valid screenings, for the screening call alone and end to end (screening
  plus its parse). Percentiles interpolate linearly between ranks, the same as numpy's default.
- **Errors**: per task and tier, the count of each status. *Invalid share* is invalid JSON +
  schema-invalid + empty, out of the calls that got an answer. Timeouts and API errors are transport
  failures, not answers, so they are listed separately.

## Reproducibility

- `@anthropic-ai/sdk` is pinned through `package-lock.json` (0.137.0), checked against `sdkVersion` before
  a real run, and recorded on every row. `.github/dependabot.yml` ignores the SDK while the experiment
  series runs; remove that entry when it's over. SDK 1.0.0 switches to API version `2026-10-21`, where
  requests with `temperature` (which both tasks set) return 400.
- Model ids come from `bench.config.json`, not from the environment. Each row records the model that
  answered, and the report warns if it differs from the one requested.
- Prices come from a dated file in `prices/`. Add a new file when prices change instead of editing an
  old one, so old reports stay explainable.

## Limitations

- Repeats count as separate observations in the agreement metrics, which makes `n` look larger than the
  number of distinct pairs. The bench does not compute confidence intervals; a pair-level bootstrap
  would be the next step.
- With 19 sample pairs, κ and ρ are very noisy. The sample set exists to check the bench end to end,
  not to support conclusions.
- One labeller per pair; there is no inter-rater agreement yet.
