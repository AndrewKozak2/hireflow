/**
 * Helpers for showing suggested jobs on applications that have no job yet.
 * A suggestion comes from GET /applications/job-suggestions:
 *   { status: "ambiguous" | "none", appliedRole, options: [{ jobId, title, source, confidence, reason }] }
 */

/**
 * Options for the "Assign job" select: suggested jobs first, then the other
 * active jobs. Without a suggestion it is the plain list of active jobs.
 */
export function buildAssignJobOptions(activeJobs, suggestion) {
  const all = activeJobs.map((job) => ({ value: job.id, label: job.title }));
  const activeIds = new Set(all.map((option) => option.value));
  const suggested = (suggestion?.options ?? [])
    .filter((option) => activeIds.has(option.jobId))
    .map((option) => ({ value: option.jobId, label: option.title }));

  if (suggested.length === 0) return all;

  const suggestedIds = new Set(suggested.map((option) => option.value));
  const rest = all.filter((option) => !suggestedIds.has(option.value));
  return [
    { group: "Suggested", items: suggested },
    ...(rest.length > 0 ? [{ group: "All open jobs", items: rest }] : []),
  ];
}

/** Short label next to "Assign job", e.g. "3 options" or "AI suggests 1". */
export function suggestionHint(suggestion) {
  const count = suggestion?.options?.length ?? 0;
  if (count === 0) return null;
  if (suggestion.status === "ambiguous") {
    return `${count} option${count === 1 ? "" : "s"}`;
  }
  return `AI suggests ${count}`;
}

/** The sentence explaining where the suggestions come from. */
export function suggestionReason(suggestion) {
  if (suggestion?.status === "ambiguous") {
    return suggestion.appliedRole
      ? `The email mentions «${suggestion.appliedRole}», which fits several open jobs. Pick the right one.`
      : "The email fits several open jobs. Pick the right one.";
  }
  return "No job named in the email. AI suggestions based on the CV.";
}

/** Badge text for one option: "From email" or "AI · medium". */
export function optionBadge(option) {
  if (option.source === "email") return "From email";
  return option.confidence ? `AI · ${option.confidence}` : "AI";
}
