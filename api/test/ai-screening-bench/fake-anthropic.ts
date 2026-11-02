import { APIConnectionTimeoutError } from "@anthropic-ai/sdk";
import type {
  Message,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";
import type { MessagesApi } from "./instrumented-llm";
import { RESUME_MARKER } from "./raw-cv-screening.task";

/**
 * A deterministic stand-in for the Anthropic Messages API, used by the dry run.
 * Its answers are produced by keyword overlap, not by a model: they exist to
 * drive every branch of the pipeline and the report, never as results.
 */

export type FakeFault = "invalid_json" | "schema_invalid" | "empty" | "timeout";

/** Call number (1-based, counting retries) → fault. Covers every failure status the bench records. */
export const DEFAULT_FAULTS: Readonly<Record<number, FakeFault>> = {
  3: "timeout",
  7: "invalid_json",
  12: "schema_invalid",
  18: "empty",
};

const SKILL_VOCABULARY = [
  "TypeScript",
  "JavaScript",
  "Node.js",
  "NestJS",
  "Express",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "CI/CD",
  "REST",
  "GraphQL",
  "React",
  "Redux",
  "Zustand",
  "React Query",
  "Vue",
  "Angular",
  "HTML",
  "CSS",
  "Jest",
  "Playwright",
  "Cypress",
  "Postman",
  "Jira",
  "Python",
  "pandas",
  "SQL",
  "Tableau",
  "Power BI",
  "Excel",
  "Java",
  "Spring",
  "Django",
  "Terraform",
];

const PARSE_TEXT_MARKER = "CV text:\n";

function wordsOf(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[\p{L}\p{N}+#.]{4,}/gu) ?? []);
}

function skillsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_VOCABULARY.filter((skill) =>
    lower.includes(skill.toLowerCase()),
  );
}

function fakeParse(cvText: string): object {
  const lines = cvText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    candidateName: lines[0] ?? null,
    email: cvText.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? null,
    phone: null,
    location: null,
    links: [],
    skills: skillsIn(cvText),
    experienceSummary: lines.slice(1, 4).join(" ").slice(0, 300) || null,
    education: lines.filter((l) =>
      /university|bachelor|master|університет/i.test(l),
    ),
    summary: lines[1] ?? null,
  };
}

function fakeScreening(prompt: string, callNumber: number): object {
  const [jobPart, resume = ""] = prompt.split(RESUME_MARKER);
  const requirements = jobPart
    .slice(jobPart.indexOf("Requirements:"))
    .split("\n")
    .filter((line) => line.startsWith("- "));
  const resumeWords = wordsOf(resume);
  const met = requirements.filter((r) =>
    [...wordsOf(r)].some((w) => resumeWords.has(w)),
  ).length;
  // A small deterministic wobble so repeats are not all identical.
  const wobble = ((callNumber % 3) - 1) * 4;
  const matchPercentage = Math.max(
    0,
    Math.min(
      100,
      Math.round((met / Math.max(requirements.length, 1)) * 100) + wobble,
    ),
  );
  const recommendation =
    matchPercentage > 70
      ? "proceed"
      : matchPercentage >= 50
        ? "review"
        : "reject";
  return {
    matchPercentage,
    recommendation,
    summary: `Fake screening: ${met} of ${requirements.length} requirements matched by keyword.`,
    extractedSkills: skillsIn(resume),
  };
}

function message(
  body: MessageCreateParamsNonStreaming,
  text: string | null,
): Message {
  const prompt =
    typeof body.messages[0]?.content === "string"
      ? body.messages[0].content
      : "";
  const system = typeof body.system === "string" ? body.system : "";
  return {
    id: "msg_fake",
    type: "message",
    role: "assistant",
    model: body.model,
    content: text === null ? [] : [{ type: "text", text, citations: null }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: Math.ceil((system.length + prompt.length) / 4),
      output_tokens: Math.ceil((text ?? "").length / 4),
    },
  } as unknown as Message;
}

export function createFakeMessagesApi(
  faults: Readonly<Record<number, FakeFault>> = DEFAULT_FAULTS,
): MessagesApi & { readonly calls: number } {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    create(body) {
      calls += 1;
      const prompt =
        typeof body.messages[0]?.content === "string"
          ? body.messages[0].content
          : "";

      switch (faults[calls]) {
        case "timeout":
          return Promise.reject(new APIConnectionTimeoutError());
        case "invalid_json":
          return Promise.resolve(
            message(
              body,
              "Sure! Here is the JSON you asked for: {matchPercentage: 80",
            ),
          );
        case "schema_invalid":
          return Promise.resolve(
            message(
              body,
              JSON.stringify({ matchPercentage: 140, recommendation: "maybe" }),
            ),
          );
        case "empty":
          return Promise.resolve(message(body, null));
      }

      const parseAt = prompt.indexOf(PARSE_TEXT_MARKER);
      const output =
        parseAt !== -1
          ? fakeParse(prompt.slice(parseAt + PARSE_TEXT_MARKER.length))
          : fakeScreening(prompt, calls);
      return Promise.resolve(message(body, JSON.stringify(output)));
    },
  };
}
