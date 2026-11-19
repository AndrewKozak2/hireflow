import { Candidate } from "src/candidate/entities/candidate.entity";
import { ParsedCvCandidateInfo } from "src/llm/tasks/parse-cv/interfaces/parse-cv.interface";

type EnrichableCandidate = Pick<Candidate, "skills" | "phone" | "linkedinUrl">;

/**
 * Trims skills, drops empty ones and removes repeats regardless of case
 * ("Employer branding" from the CV and "Employer Branding" from a screening
 * are one skill). The first spelling wins, so existing skills keep theirs.
 */
export function uniqueSkills(skills: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of skills) {
    const skill = raw?.trim();
    if (!skill) continue;
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(skill);
  }
  return result;
}

/**
 * What a parsed CV adds to a candidate's profile: its skills (plus any skills
 * an AI screening extracted) merged into the existing ones, and the phone and
 * LinkedIn URL only when the profile has none yet. Returns only the fields that
 * actually change, so an empty object means there is nothing to save.
 */
export function buildCandidateUpdateFromCv(
  candidate: EnrichableCandidate,
  parsedCv: Pick<ParsedCvCandidateInfo, "skills" | "phone" | "links"> | null,
  extraSkills: string[] = [],
): Partial<EnrichableCandidate> {
  const update: Partial<EnrichableCandidate> = {};
  const currentSkills = candidate.skills ?? [];

  const mergedSkills = uniqueSkills([
    ...currentSkills,
    ...(parsedCv?.skills ?? []),
    ...extraSkills,
  ]);
  // Also saves when merging only removed repeats the profile already had.
  if (
    mergedSkills.length !== currentSkills.length ||
    mergedSkills.some((skill, index) => skill !== currentSkills[index])
  ) {
    update.skills = mergedSkills;
  }

  if (parsedCv?.phone && !candidate.phone) {
    update.phone = parsedCv.phone;
  }

  const linkedin = parsedCv?.links?.find((link) =>
    link.includes("linkedin.com"),
  );
  if (linkedin && !candidate.linkedinUrl) {
    update.linkedinUrl = linkedin;
  }

  return update;
}
