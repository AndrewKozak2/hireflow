import { findJobsByAppliedRole, resolveAppliedJob } from "./applied-role.utils";

// The open jobs on production when this was written.
const productionJobs = [
  { id: "frontend", title: "Junior Frontend Developer (React)" },
  { id: "backend", title: "Middle Backend Developer (Node.js / NestJS)" },
  { id: "qa", title: "QA Engineer (Manual + Automation)" },
  { id: "design", title: "UI/UX Designer" },
  { id: "marketing", title: "Recruitment Marketing Specialist" },
];

// Several similar frontend jobs open at once.
const frontendJobs = [
  { id: "junior-fe", title: "Junior Frontend Developer (React)" },
  { id: "middle-fe", title: "Middle Frontend Developer" },
  { id: "react", title: "React Developer" },
];

const ids = (jobs: { id: string }[]) => jobs.map((job) => job.id);

describe("findJobsByAppliedRole", () => {
  const find = (role: string | null | undefined, jobs = productionJobs) =>
    ids(findJobsByAppliedRole(role, jobs));

  it.each([
    ["Junior Frontend Developer (React)", "frontend"],
    ["UI/UX Designer", "design"],
    ["ui/ux designer", "design"],
    ["Junior Frontend Developer", "frontend"],
    ["Middle Backend Developer", "backend"],
    ["QA Engineer", "qa"],
    ["Frontend Developer", "frontend"],
    ["Marketing Specialist", "marketing"],
  ])("finds %s", (role, expected) => {
    expect(find(role)).toEqual([expected]);
  });

  it.each(["Developer", "Designer", "Engineer"])(
    "does not guess from a single word (%s)",
    (role) => {
      expect(find(role)).toEqual([]);
    },
  );

  it.each(["Data Scientist", "Фронтенд девелопер", "", "   ", null, undefined])(
    "finds nothing for %p (rules do not translate; the parser does)",
    (role) => {
      expect(find(role)).toEqual([]);
    },
  );

  it("returns every job a vague role fits", () => {
    expect(find("Frontend Developer", frontendJobs)).toEqual([
      "junior-fe",
      "middle-fe",
    ]);
  });

  it("lets a precise title win over looser matches", () => {
    expect(find("Junior Frontend Developer (React)", frontendJobs)).toEqual([
      "junior-fe",
    ]);
    expect(find("React Developer", frontendJobs)).toEqual(["react"]);
  });
});

describe("resolveAppliedJob", () => {
  const resolve = (
    email: { appliedRole?: string | null; appliedJobTitles?: string[] },
    jobs = productionJobs,
  ) => {
    const result = resolveAppliedJob(email, jobs);
    return {
      status: result.status,
      job: result.job?.id ?? null,
      candidates: ids(result.candidates),
    };
  };

  it("identifies the job when the role names one open job", () => {
    expect(resolve({ appliedRole: "UI/UX Designer" })).toEqual({
      status: "identified",
      job: "design",
      candidates: ["design"],
    });
  });

  it("identifies a translated or transliterated role picked by the parser", () => {
    expect(
      resolve({
        appliedRole: "Фронтенд девелопер",
        appliedJobTitles: ["Junior Frontend Developer (React)"],
      }),
    ).toMatchObject({ status: "identified", job: "frontend" });
  });

  it("identifies the job when the role text and the parser agree", () => {
    expect(
      resolve({
        appliedRole: "Junior Frontend Developer",
        appliedJobTitles: ["Junior Frontend Developer (React)"],
      }),
    ).toMatchObject({ status: "identified", job: "frontend" });
  });

  it("is ambiguous for a vague role while several similar jobs are open", () => {
    expect(
      resolve(
        {
          appliedRole: "Frontend Developer",
          appliedJobTitles: [
            "Junior Frontend Developer (React)",
            "Middle Frontend Developer",
          ],
        },
        frontendJobs,
      ),
    ).toEqual({
      status: "ambiguous",
      job: null,
      candidates: ["junior-fe", "middle-fe"],
    });
  });

  it("is ambiguous when the candidate applies for two jobs in one email", () => {
    expect(
      resolve({
        appliedRole: null,
        appliedJobTitles: [
          "QA Engineer (Manual + Automation)",
          "UI/UX Designer",
        ],
      }),
    ).toMatchObject({ status: "ambiguous", candidates: ["qa", "design"] });
  });

  it("is ambiguous when the role text and the parser disagree", () => {
    expect(
      resolve({
        appliedRole: "UI/UX Designer",
        appliedJobTitles: ["Recruitment Marketing Specialist"],
      }),
    ).toMatchObject({
      status: "ambiguous",
      candidates: ["design", "marketing"],
    });
  });

  it("ignores titles the parser made up", () => {
    expect(
      resolve({
        appliedRole: null,
        appliedJobTitles: ["Senior Frontend Developer", "UI/UX Designer"],
      }),
    ).toMatchObject({ status: "identified", job: "design" });
  });

  it.each([
    [
      "no role at all (CV for future openings)",
      { appliedRole: null, appliedJobTitles: [] },
    ],
    [
      "a role that is not open",
      { appliedRole: "Data Scientist", appliedJobTitles: [] },
    ],
    ["only a vague single word", { appliedRole: "Developer" }],
  ])("leaves the application unassigned for %s", (_case, email) => {
    expect(resolve(email)).toEqual({
      status: "none",
      job: null,
      candidates: [],
    });
  });

  it("leaves everything unassigned when no jobs are open", () => {
    expect(
      resolve(
        { appliedRole: "QA Engineer", appliedJobTitles: ["QA Engineer"] },
        [],
      ),
    ).toEqual({ status: "none", job: null, candidates: [] });
  });
});
