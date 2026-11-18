import {
  accuracy,
  answerStability,
  averageRanks,
  confusionMatrix,
  percentile,
  scoreSpread,
  spearman,
  weightedKappa,
} from "./metrics";
import { RECOMMENDATIONS } from "./types";

// Reference values were computed independently with numpy (matrix form of the
// same definitions), not with this module.
const MATRIX = [
  [10, 4, 1],
  [3, 12, 5],
  [0, 2, 13],
];

describe("confusionMatrix", () => {
  it("puts the reference in rows and the prediction in columns", () => {
    const matrix = confusionMatrix(RECOMMENDATIONS, [
      { reference: "reject", predicted: "reject" },
      { reference: "reject", predicted: "review" },
      { reference: "proceed", predicted: "review" },
      { reference: "proceed", predicted: "proceed" },
      { reference: "proceed", predicted: "proceed" },
    ]);

    expect(matrix).toEqual([
      [1, 1, 0],
      [0, 0, 0],
      [0, 1, 2],
    ]);
  });

  it("rejects a class it does not know", () => {
    expect(() =>
      confusionMatrix(RECOMMENDATIONS, [
        { reference: "reject", predicted: "maybe" },
      ]),
    ).toThrow("Unknown class");
  });
});

describe("accuracy", () => {
  it("is the share of the diagonal", () => {
    expect(accuracy(MATRIX)).toBeCloseTo(35 / 50, 12);
  });

  it("is null for an empty matrix", () => {
    expect(
      accuracy([
        [0, 0],
        [0, 0],
      ]),
    ).toBeNull();
  });
});

describe("weightedKappa", () => {
  it("matches the classic 2×2 unweighted example (po 0.7, pe 0.5 → 0.4)", () => {
    expect(
      weightedKappa(
        [
          [20, 5],
          [10, 15],
        ],
        "none",
      ),
    ).toBeCloseTo(0.4, 12);
  });

  it.each([
    ["none", 0.5481927710843374],
    ["linear", 0.6261682242990654],
    ["quadratic", 0.7096774193548387],
  ] as const)(
    "matches the %s-weighted reference value",
    (weighting, expected) => {
      expect(weightedKappa(MATRIX, weighting)).toBeCloseTo(expected, 12);
    },
  );

  it("is 1 for perfect agreement", () => {
    const perfect = [
      [5, 0, 0],
      [0, 3, 0],
      [0, 0, 7],
    ];
    expect(weightedKappa(perfect, "linear")).toBeCloseTo(1, 12);
    expect(weightedKappa(perfect, "quadratic")).toBeCloseTo(1, 12);
  });

  it("penalises a two-step disagreement more than a one-step one", () => {
    const oneStep = [
      [8, 2, 0],
      [0, 10, 0],
      [0, 0, 10],
    ];
    const twoSteps = [
      [8, 0, 2],
      [0, 10, 0],
      [0, 0, 10],
    ];
    expect(weightedKappa(oneStep, "linear")!).toBeGreaterThan(
      weightedKappa(twoSteps, "linear")!,
    );
    // Unweighted kappa does not see the distance between classes.
    expect(weightedKappa(oneStep, "none")).toBeCloseTo(
      weightedKappa(twoSteps, "none")!,
      1,
    );
  });

  it("is null when chance disagreement is zero", () => {
    expect(
      weightedKappa(
        [
          [0, 0, 0],
          [0, 6, 0],
          [0, 0, 0],
        ],
        "linear",
      ),
    ).toBeNull();
    expect(
      weightedKappa(
        [
          [0, 0],
          [0, 0],
        ],
        "linear",
      ),
    ).toBeNull();
  });
});

describe("spearman", () => {
  it("matches the textbook example with one tie", () => {
    // ranks of y: 1, 2, 3.5, 5, 3.5 → ρ = 8 / √95
    expect(spearman([1, 2, 3, 4, 5], [5, 6, 7, 8, 7])).toBeCloseTo(
      0.8207826816681233,
      12,
    );
  });

  it("uses average ranks for ties in both series", () => {
    expect(spearman([10, 20, 20, 30, 40, 40], [1, 3, 2, 2, 5, 4])).toBeCloseTo(
      0.8508410434878082,
      12,
    );
  });

  it("is ±1 for monotonic series, whatever the spacing", () => {
    expect(spearman([1, 2, 3, 4], [10, 100, 1000, 10000])).toBeCloseTo(1, 12);
    expect(spearman([1, 2, 3, 4], [9, 7, 3, 1])).toBeCloseTo(-1, 12);
  });

  it("is null for fewer than two points or a constant series", () => {
    expect(spearman([1], [2])).toBeNull();
    expect(spearman([1, 2, 3], [5, 5, 5])).toBeNull();
  });
});

describe("averageRanks", () => {
  it("gives tied values the mean of their ranks", () => {
    expect(averageRanks([30, 10, 20, 10])).toEqual([4, 1.5, 3, 1.5]);
  });
});

describe("percentile", () => {
  it("interpolates between closest ranks (numpy's default)", () => {
    expect(percentile([10, 1, 4, 3, 2], 0.5)).toBe(3);
    expect(percentile([1, 2, 3, 4, 10], 0.95)).toBeCloseTo(8.8, 12);
    expect(percentile([5], 0.95)).toBe(5);
    expect(percentile([], 0.5)).toBeNull();
  });
});

describe("answerStability", () => {
  it("averages the share of the most frequent answer and counts unanimous groups", () => {
    const stability = answerStability([
      ["proceed", "proceed", "proceed"],
      ["review", "proceed", "review"],
      ["reject"], // a single answer says nothing about stability
    ]);
    expect(stability.groups).toBe(2);
    expect(stability.modalAgreement).toBeCloseTo((1 + 2 / 3) / 2, 12);
    expect(stability.unanimousShare).toBe(0.5);
  });

  it("is empty when no group has two answers", () => {
    expect(answerStability([["proceed"]])).toEqual({
      groups: 0,
      modalAgreement: null,
      unanimousShare: null,
    });
  });
});

describe("scoreSpread", () => {
  it("averages the range and the sample standard deviation per group", () => {
    const spread = scoreSpread([
      [70, 74, 78],
      [50, 50],
    ]);
    expect(spread.groups).toBe(2);
    expect(spread.meanRange).toBe((8 + 0) / 2);
    expect(spread.meanStdDev).toBeCloseTo((4 + 0) / 2, 12);
  });
});
