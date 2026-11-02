import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import {
  BENCH_DIR,
  loadBenchConfig,
  loadDataset,
  loadPriceList,
  splitRequirements,
} from "./loaders";

describe("sample dataset and config", () => {
  it("loads, and stays within the size the bench was designed for", () => {
    const dataset = loadDataset();

    expect(dataset.jobs.length).toBeGreaterThanOrEqual(3);
    expect(dataset.jobs.length).toBeLessThanOrEqual(5);
    expect(dataset.cvs.length).toBeGreaterThanOrEqual(10);
    expect(dataset.cvs.length).toBeLessThanOrEqual(20);
    const usedCvs = new Set(dataset.pairs.map((p) => p.cv.id));
    expect(dataset.cvs.filter((cv) => !usedCvs.has(cv.id))).toEqual([]);
  });

  it("prices every model the config can call", () => {
    const config = loadBenchConfig();
    const prices = loadPriceList(resolve(BENCH_DIR, config.priceList));

    expect(Object.keys(prices.models)).toEqual(
      expect.arrayContaining([config.models.light, config.models.heavy]),
    );
  });
});

describe("splitRequirements", () => {
  it("splits like production: per line, trimmed, empty lines dropped", () => {
    expect(splitRequirements("  Node.js \n\nPostgreSQL\r\n  ")).toEqual([
      "Node.js",
      "PostgreSQL",
    ]);
  });
});

describe("loadDataset validation", () => {
  let dir: string;

  const write = (labels: unknown[]) => {
    writeFileSync(join(dir, "labels.json"), JSON.stringify(labels));
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "bench-dataset-"));
    mkdirSync(join(dir, "cvs"));
    writeFileSync(
      join(dir, "cvs", "cv-a.txt"),
      "Jane Example\nNode.js developer\n",
    );
    writeFileSync(
      join(dir, "jobs.json"),
      JSON.stringify([
        { id: "job-a", title: "Backend", requirements: "Node.js\nPostgreSQL" },
      ]),
    );
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("accepts labelled and unlabelled pairs", () => {
    write([
      {
        cvId: "cv-a",
        jobId: "job-a",
        recommendation: "review",
        score: 60,
        labeller: "J.D.",
        labelledAt: "2026-11-02",
      },
    ]);
    const dataset = loadDataset(dir);
    expect(dataset.pairs).toHaveLength(1);
    expect(dataset.pairs[0].id).toBe("cv-a__job-a");
    expect(dataset.pairs[0].label.score).toBe(60);
  });

  it.each([
    [
      {
        cvId: "cv-a",
        jobId: "job-a",
        recommendation: "maybe",
        labeller: "J.D.",
      },
      "recommendation must be one of",
    ],
    [
      {
        cvId: "cv-a",
        jobId: "job-a",
        recommendation: "review",
        score: 101,
        labeller: "J.D.",
      },
      "score must be an integer 0-100",
    ],
    [
      { cvId: "cv-a", jobId: "job-a", recommendation: null, score: 50 },
      "a score needs a recommendation",
    ],
    [
      { cvId: "cv-a", jobId: "job-a", recommendation: "proceed" },
      "needs a labeller",
    ],
    [
      {
        cvId: "cv-a",
        jobId: "job-a",
        recomendation: "proceed",
        labeller: "J.D.",
      },
      "unknown field(s) recomendation",
    ],
    [
      { cvId: "cv-x", jobId: "job-a", recommendation: null },
      'unknown cvId "cv-x"',
    ],
    [
      { cvId: "cv-a", jobId: "job-x", recommendation: null },
      'unknown jobId "job-x"',
    ],
  ])("rejects %o", (label, message) => {
    write([label]);
    expect(() => loadDataset(dir)).toThrow(message);
  });

  it("rejects a pair listed twice", () => {
    write([
      { cvId: "cv-a", jobId: "job-a", recommendation: null },
      { cvId: "cv-a", jobId: "job-a", recommendation: null },
    ]);
    expect(() => loadDataset(dir)).toThrow("duplicate pair");
  });
});
