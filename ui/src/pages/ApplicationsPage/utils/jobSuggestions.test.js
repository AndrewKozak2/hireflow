import { describe, it, expect } from "vitest";
import {
  buildAssignJobOptions,
  optionBadge,
  suggestionHint,
  suggestionReason,
} from "./jobSuggestions";

const activeJobs = [
  { id: "junior-fe", title: "Junior Frontend Developer (React)" },
  { id: "middle-fe", title: "Middle Frontend Developer" },
  { id: "qa", title: "QA Engineer (Manual + Automation)" },
];

const ambiguous = {
  status: "ambiguous",
  appliedRole: "Фронтенд девелопер",
  options: [
    {
      jobId: "junior-fe",
      title: "Junior Frontend Developer (React)",
      source: "email",
      confidence: null,
      reason: null,
    },
    {
      jobId: "middle-fe",
      title: "Middle Frontend Developer",
      source: "email",
      confidence: null,
      reason: null,
    },
  ],
};

const aiSuggested = {
  status: "none",
  appliedRole: null,
  options: [
    {
      jobId: "qa",
      title: "QA Engineer (Manual + Automation)",
      source: "ai",
      confidence: "medium",
      reason: "Testing course",
    },
  ],
};

describe("buildAssignJobOptions", () => {
  it("is the plain list of active jobs without a suggestion", () => {
    expect(buildAssignJobOptions(activeJobs, null)).toEqual([
      { value: "junior-fe", label: "Junior Frontend Developer (React)" },
      { value: "middle-fe", label: "Middle Frontend Developer" },
      { value: "qa", label: "QA Engineer (Manual + Automation)" },
    ]);
  });

  it("puts suggested jobs first and the rest below", () => {
    expect(buildAssignJobOptions(activeJobs, ambiguous)).toEqual([
      {
        group: "Suggested",
        items: [
          { value: "junior-fe", label: "Junior Frontend Developer (React)" },
          { value: "middle-fe", label: "Middle Frontend Developer" },
        ],
      },
      {
        group: "All open jobs",
        items: [{ value: "qa", label: "QA Engineer (Manual + Automation)" }],
      },
    ]);
  });

  it("drops suggested jobs that are no longer active", () => {
    const stale = {
      ...aiSuggested,
      options: [
        {
          jobId: "closed",
          title: "Closed job",
          source: "ai",
          confidence: "high",
        },
      ],
    };
    expect(buildAssignJobOptions(activeJobs, stale)).toHaveLength(3);
  });

  it("omits the second group when every job is suggested", () => {
    const options = buildAssignJobOptions(activeJobs.slice(0, 2), ambiguous);
    expect(options).toHaveLength(1);
    expect(options[0].group).toBe("Suggested");
  });
});

describe("suggestionHint", () => {
  it.each([
    [ambiguous, "2 options"],
    [aiSuggested, "AI suggests 1"],
    [{ status: "ambiguous", options: [ambiguous.options[0]] }, "1 option"],
    [null, null],
    [{ status: "none", options: [] }, null],
  ])("labels %o as %p", (suggestion, expected) => {
    expect(suggestionHint(suggestion)).toBe(expected);
  });
});

describe("suggestionReason", () => {
  it("quotes the role the email mentioned when it is ambiguous", () => {
    expect(suggestionReason(ambiguous)).toBe(
      "The email mentions «Фронтенд девелопер», which fits several open jobs. Pick the right one.",
    );
  });

  it("explains AI suggestions when no job was named", () => {
    expect(suggestionReason(aiSuggested)).toBe(
      "No job named in the email. AI suggestions based on the CV.",
    );
  });
});

describe("optionBadge", () => {
  it.each([
    [{ source: "email" }, "From email"],
    [{ source: "ai", confidence: "medium" }, "AI · medium"],
    [{ source: "ai", confidence: null }, "AI"],
  ])("labels %o as %p", (option, expected) => {
    expect(optionBadge(option)).toBe(expected);
  });
});
