import {
  buildCandidateUpdateFromCv,
  uniqueSkills,
} from "./candidate-cv-enrichment.utils";

describe("buildCandidateUpdateFromCv", () => {
  const emptyCandidate = { skills: [], phone: "", linkedinUrl: "" };
  const cv = (
    overrides: Partial<{
      skills: string[];
      phone: string | null;
      links: string[];
    }> = {},
  ) => ({ skills: [], phone: null, links: [], ...overrides });

  it("saves the CV's skills on a candidate who has none", () => {
    expect(
      buildCandidateUpdateFromCv(
        emptyCandidate,
        cv({ skills: ["React", "TypeScript"] }),
      ),
    ).toEqual({ skills: ["React", "TypeScript"] });
  });

  it("merges CV and screening skills into existing ones without duplicates", () => {
    const update = buildCandidateUpdateFromCv(
      { ...emptyCandidate, skills: ["React"] },
      cv({ skills: ["React", " Git "] }),
      ["Git", "REST API", ""],
    );

    expect(update.skills).toEqual(["React", "Git", "REST API"]);
  });

  it("treats skills that differ only in case as the same skill", () => {
    const update = buildCandidateUpdateFromCv(
      emptyCandidate,
      cv({ skills: ["Employer branding", "UTM tracking"] }),
      ["Employer Branding", "UTM Tracking", "Paid Campaign Management"],
    );

    expect(update.skills).toEqual([
      "Employer branding",
      "UTM tracking",
      "Paid Campaign Management",
    ]);
  });

  it("cleans up repeats a profile already has", () => {
    const update = buildCandidateUpdateFromCv(
      { ...emptyCandidate, skills: ["Figma", "figma", "Canva"] },
      cv({ skills: ["Canva"] }),
    );

    expect(update.skills).toEqual(["Figma", "Canva"]);
  });

  it("returns nothing to save when the CV adds nothing new", () => {
    expect(
      buildCandidateUpdateFromCv(
        {
          skills: ["React"],
          phone: "+380501112233",
          linkedinUrl: "https://linkedin.com/in/x",
        },
        cv({
          skills: ["React"],
          phone: "+380679999999",
          links: ["https://linkedin.com/in/y"],
        }),
      ),
    ).toEqual({});
  });

  it("fills the phone and LinkedIn only when the profile has none", () => {
    expect(
      buildCandidateUpdateFromCv(
        emptyCandidate,
        cv({
          phone: "+380501112233",
          links: ["https://github.com/x", "https://www.linkedin.com/in/mariia"],
        }),
      ),
    ).toEqual({
      phone: "+380501112233",
      linkedinUrl: "https://www.linkedin.com/in/mariia",
    });
  });

  it("uses screening skills alone when there is no parsed CV", () => {
    expect(
      buildCandidateUpdateFromCv(emptyCandidate, null, ["Python"]),
    ).toEqual({
      skills: ["Python"],
    });
  });
});

describe("uniqueSkills", () => {
  it("trims, drops empty values and keeps the first spelling", () => {
    expect(uniqueSkills([" React ", "react", "", null, "REST API"])).toEqual([
      "React",
      "REST API",
    ]);
  });
});
