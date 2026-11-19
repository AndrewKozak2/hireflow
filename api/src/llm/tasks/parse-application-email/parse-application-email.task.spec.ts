import { parseApplicationEmailTask } from "./parse-application-email.task";
import { parseApplicationEmailSchema } from "./parse-application-email.schema";

describe("parseApplicationEmailTask", () => {
  const prompt = (openJobTitles?: string[]) =>
    parseApplicationEmailTask.buildPrompt({
      subject: "Відгук на вакансію Фронтенд девелопер",
      body: "Добрий день, резюме в додатку.",
      openJobTitles,
    });

  it("lists the open job titles for the model to choose from", () => {
    const text = prompt([
      "Junior Frontend Developer (React)",
      "Middle Frontend Developer",
    ]);

    expect(text).toContain("appliedJobTitles");
    expect(text).toContain("- Junior Frontend Developer (React)");
    expect(text).toContain("- Middle Frontend Developer");
    expect(text).toContain("Copy titles EXACTLY");
  });

  it("says when no jobs are open", () => {
    expect(prompt([])).toContain("No open jobs.");
    expect(prompt()).toContain("No open jobs.");
  });
});

describe("parseApplicationEmailSchema", () => {
  const base = {
    candidateName: "Mariia",
    email: null,
    phone: null,
    appliedRole: "Фронтенд девелопер",
    location: null,
    links: [],
    summary: null,
    isApplication: true,
  };

  it("keeps the job titles the model picked", () => {
    expect(
      parseApplicationEmailSchema.parse({
        ...base,
        appliedJobTitles: ["Junior Frontend Developer (React)"],
      }).appliedJobTitles,
    ).toEqual(["Junior Frontend Developer (React)"]);
  });

  it.each([undefined, null])(
    "treats a missing list (%p) as no job picked instead of failing",
    (value) => {
      expect(
        parseApplicationEmailSchema.parse({ ...base, appliedJobTitles: value })
          .appliedJobTitles,
      ).toEqual([]);
    },
  );
});
