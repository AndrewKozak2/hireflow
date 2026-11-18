import { Candidate } from "src/candidate/entities/candidate.entity";
import { ParsedCvCandidateInfo } from "src/llm/tasks/parse-cv/interfaces/parse-cv.interface";

type EnrichableCandidate = Pick<Candidate, "skills" | "phone" | "linkedinUrl">;

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

  const mergedSkills = Array.from(
    new Set(
      [...currentSkills, ...(parsedCv?.skills ?? []), ...extraSkills]
        .map((skill) => skill?.trim())
        .filter((skill): skill is string => !!skill),
    ),
  );
  if (mergedSkills.length > currentSkills.length) {
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
