/**
 * Pure metric functions. Classes are passed in order (worst → best), so the
 * index of a class is its position on the ordinal scale.
 */

export type KappaWeighting = "none" | "linear" | "quadratic";

/** `matrix[i][j]` = number of items the reference (human) put in class i and the rater (model) in class j. */
export function confusionMatrix<T>(
  classes: readonly T[],
  observations: { reference: T; predicted: T }[],
): number[][] {
  const matrix = classes.map(() => classes.map(() => 0));
  for (const { reference, predicted } of observations) {
    const i = classes.indexOf(reference);
    const j = classes.indexOf(predicted);
    if (i === -1 || j === -1) {
      throw new Error(
        `Unknown class in observation: ${String(reference)} / ${String(predicted)}`,
      );
    }
    matrix[i][j] += 1;
  }
  return matrix;
}

function total(matrix: number[][]): number {
  return matrix.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
}

export function accuracy(matrix: number[][]): number | null {
  const n = total(matrix);
  if (n === 0) return null;
  return matrix.reduce((sum, row, i) => sum + row[i], 0) / n;
}

function disagreementWeight(
  i: number,
  j: number,
  k: number,
  weighting: KappaWeighting,
): number {
  if (weighting === "none") return i === j ? 0 : 1;
  const distance = Math.abs(i - j) / (k - 1);
  return weighting === "linear" ? distance : distance * distance;
}

/**
 * Cohen's kappa with disagreement weights:
 * κ_w = 1 − Σ w_ij·O_ij / Σ w_ij·E_ij, where O is the observed share and E the
 * share expected by chance from the two raters' marginals. Linear weights
 * penalise "reject vs proceed" twice as much as "reject vs review"; quadratic
 * four times. Returns null when chance disagreement is zero (both raters used a
 * single, identical class), where κ is undefined.
 */
export function weightedKappa(
  matrix: number[][],
  weighting: KappaWeighting,
): number | null {
  const k = matrix.length;
  const n = total(matrix);
  if (n === 0 || k < 2) return null;

  const rowTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));
  const columnTotals = matrix[0].map((_, j) =>
    matrix.reduce((sum, row) => sum + row[j], 0),
  );

  let observed = 0;
  let expected = 0;
  for (let i = 0; i < k; i += 1) {
    for (let j = 0; j < k; j += 1) {
      const w = disagreementWeight(i, j, k, weighting);
      observed += (w * matrix[i][j]) / n;
      expected += (w * rowTotals[i] * columnTotals[j]) / (n * n);
    }
  }
  if (expected === 0) return null;
  return 1 - observed / expected;
}

/** Ranks starting at 1; tied values get the average of the ranks they span. */
export function averageRanks(values: number[]): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);
  let start = 0;
  while (start < order.length) {
    let end = start;
    while (
      end + 1 < order.length &&
      order[end + 1].value === order[start].value
    )
      end += 1;
    const rank = (start + end) / 2 + 1;
    for (let i = start; i <= end; i += 1) ranks[order[i].index] = rank;
    start = end + 1;
  }
  return ranks;
}

function pearson(x: number[], y: number[]): number | null {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let i = 0; i < n; i += 1) {
    covariance += (x[i] - meanX) * (y[i] - meanY);
    varianceX += (x[i] - meanX) ** 2;
    varianceY += (y[i] - meanY) ** 2;
  }
  if (varianceX === 0 || varianceY === 0) return null;
  return covariance / Math.sqrt(varianceX * varianceY);
}

/** Spearman's ρ: Pearson correlation of average ranks (handles ties). Null for n < 2 or a constant series. */
export function spearman(x: number[], y: number[]): number | null {
  if (x.length !== y.length)
    throw new Error("spearman: series differ in length");
  if (x.length < 2) return null;
  return pearson(averageRanks(x), averageRanks(y));
}

/** Percentile with linear interpolation between closest ranks (the common "type 7" definition). */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface AnswerStability {
  /** Groups (pairs) with at least two answers. */
  groups: number;
  /** Mean, over groups, of the share of answers equal to the group's most frequent answer. */
  modalAgreement: number | null;
  /** Share of groups where every answer was the same. */
  unanimousShare: number | null;
}

export function answerStability<T>(groups: T[][]): AnswerStability {
  const usable = groups.filter((g) => g.length >= 2);
  const modalShares = usable.map((group) => {
    const counts = new Map<T, number>();
    for (const answer of group)
      counts.set(answer, (counts.get(answer) ?? 0) + 1);
    return Math.max(...counts.values()) / group.length;
  });
  return {
    groups: usable.length,
    modalAgreement: mean(modalShares),
    unanimousShare:
      usable.length === 0
        ? null
        : modalShares.filter((s) => s === 1).length / usable.length,
  };
}

export interface ScoreSpread {
  groups: number;
  /** Mean of (max − min) within a group. */
  meanRange: number | null;
  /** Mean of the sample standard deviation within a group. */
  meanStdDev: number | null;
}

export function scoreSpread(groups: number[][]): ScoreSpread {
  const usable = groups.filter((g) => g.length >= 2);
  const ranges = usable.map((g) => Math.max(...g) - Math.min(...g));
  const deviations = usable.map((g) => {
    const m = mean(g) as number;
    return Math.sqrt(
      g.reduce((sum, v) => sum + (v - m) ** 2, 0) / (g.length - 1),
    );
  });
  return {
    groups: usable.length,
    meanRange: mean(ranges),
    meanStdDev: mean(deviations),
  };
}
