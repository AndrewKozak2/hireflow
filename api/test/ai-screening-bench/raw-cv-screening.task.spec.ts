import { aiScreeningTask } from "../../src/llm/tasks/ai-screening/ai-screening.task";
import {
  EMPTY_PARSED_CV,
  RESUME_MARKER,
  rawCvScreeningTask,
} from "./raw-cv-screening.task";

describe("rawCvScreeningTask (ablation)", () => {
  const job = {
    jobTitle: "Senior Backend Engineer (Node.js)",
    jobRequirements: ["5+ years of Node.js", "PostgreSQL"],
  };

  it("relies on the production prompt containing the resume marker exactly once", () => {
    const prompt = aiScreeningTask.buildPrompt({
      ...job,
      parsedCv: EMPTY_PARSED_CV,
    });
    expect(prompt.split(RESUME_MARKER)).toHaveLength(2);
  });

  it("keeps the production prompt up to the marker and puts the raw CV after it", () => {
    const rawCvText =
      "Jane Example\nNode.js developer, 6 years\nSkills: NestJS, PostgreSQL";
    const production = aiScreeningTask.buildPrompt({
      ...job,
      parsedCv: {
        ...EMPTY_PARSED_CV,
        skills: ["NestJS"],
        summary: "parsed summary",
      },
    });
    const ablation = rawCvScreeningTask.buildPrompt({ ...job, rawCvText });

    const prefix = production.slice(
      0,
      production.indexOf(RESUME_MARKER) + RESUME_MARKER.length,
    );
    expect(ablation).toBe(`${prefix}\n${rawCvText}`);
    expect(ablation).not.toContain("parsed summary");
    expect(ablation).not.toContain("Skills: None");
  });

  it("inherits everything else from the production task", () => {
    expect(rawCvScreeningTask.tier).toBe(aiScreeningTask.tier);
    expect(rawCvScreeningTask.temperature).toBe(aiScreeningTask.temperature);
    expect(rawCvScreeningTask.maxTokens).toBe(aiScreeningTask.maxTokens);
    expect(rawCvScreeningTask.systemPrompt).toBe(aiScreeningTask.systemPrompt);
    expect(rawCvScreeningTask.outputSchema).toBe(aiScreeningTask.outputSchema);
    expect(rawCvScreeningTask.name).not.toBe(aiScreeningTask.name);
  });
});
