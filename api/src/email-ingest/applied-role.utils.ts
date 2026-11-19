/**
 * Deciding which open job an emailed application belongs to.
 *
 * Which job someone applied for is a fact from the email; how well they fit is
 * scored by AI screening afterwards. So an application is linked to a job only
 * when the email identifies exactly one open job, and never by guessing from
 * the CV. A vague or unknown role, or no role at all (a CV sent "for future
 * openings"), leaves the application unassigned for a recruiter to decide.
 */

export type AppliedJobStatus = "identified" | "ambiguous" | "none";

export interface AppliedJobResolution<T> {
  status: AppliedJobStatus;
  /** Set only when status is "identified". */
  job: T | null;
  /** Every open job the email could refer to (one, several or none). */
  candidates: T[];
}

/**
 * Open jobs whose title matches the role written in the email, by rules from
 * strictest to loosest. The first rule that matches anything decides, so a
 * precise title is never diluted by looser matches:
 *   1. full title, including the part in parentheses
 *   2. title without parentheses ("Junior Frontend Developer (React)" ->
 *      "junior frontend developer")
 *   3. every word of the role (at least two) appears in the title
 * Several results mean the role is ambiguous.
 */
export function findJobsByAppliedRole<T extends { id: string; title: string }>(
  appliedRole: string | null | undefined,
  jobs: T[],
): T[] {
  if (!appliedRole?.trim() || jobs.length === 0) return [];

  const fullRole = normalize(appliedRole);
  const coreRole = normalize(stripParentheses(appliedRole));
  if (!coreRole) return [];

  const byFullTitle = jobs.filter((job) => normalize(job.title) === fullRole);
  if (byFullTitle.length > 0) return byFullTitle;

  const byCoreTitle = jobs.filter(
    (job) => normalize(stripParentheses(job.title)) === coreRole,
  );
  if (byCoreTitle.length > 0) return byCoreTitle;

  const roleWords = coreRole.split(" ");
  if (roleWords.length < 2) return [];

  return jobs.filter((job) => {
    const titleWords = new Set(
      normalize(stripParentheses(job.title)).split(" "),
    );
    return roleWords.every((word) => titleWords.has(word));
  });
}

/**
 * Combines the two signals about which job was meant: the role text matched
 * by rules (findJobsByAppliedRole) and the open-job titles the email parser
 * picked from the list it was given (it handles translations, transliteration
 * and typos). Titles the parser invented, i.e. not open jobs, are ignored.
 * The application is linked only when together they point to exactly one job.
 */
export function resolveAppliedJob<T extends { id: string; title: string }>(
  email: {
    appliedRole?: string | null;
    appliedJobTitles?: string[] | null;
  },
  jobs: T[],
): AppliedJobResolution<T> {
  const byRole = findJobsByAppliedRole(email.appliedRole, jobs);
  const pickedTitles = new Set(
    (email.appliedJobTitles ?? []).map((title) => normalize(title)),
  );
  const byParser = jobs.filter((job) => pickedTitles.has(normalize(job.title)));

  const candidates = [...byRole, ...byParser].filter(
    (job, index, all) =>
      all.findIndex((other) => other.id === job.id) === index,
  );

  if (candidates.length === 1) {
    return { status: "identified", job: candidates[0], candidates };
  }
  return {
    status: candidates.length > 1 ? "ambiguous" : "none",
    job: null,
    candidates,
  };
}

function stripParentheses(title: string): string {
  return title.replace(/\([^)]*\)/g, " ");
}

/** Lowercase words; keeps letters (any script), digits and + # / (C++, C#, UI/UX). */
function normalize(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#/]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
