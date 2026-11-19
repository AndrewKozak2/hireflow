import { DataSource, In, IsNull, Not } from "typeorm";
import { ApplicationJobSuggestionsService } from "./application-job-suggestions.service";
import { Application } from "./entities/application.entity";
import { EmailIngestionEvent } from "../email-ingest/entities/email-ingestion-event.entity";
import { Job } from "../job/entities/job.entity";
import { ApplicationStage } from "./enums/application-stage.enum";

describe("ApplicationJobSuggestionsService", () => {
  const repos = {
    applications: { find: jest.fn() },
    events: { find: jest.fn() },
    jobs: { find: jest.fn() },
  };
  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Application) return repos.applications;
      if (entity === EmailIngestionEvent) return repos.events;
      if (entity === Job) return repos.jobs;
      throw new Error("unexpected repository");
    }),
  } as unknown as DataSource;
  const service = new ApplicationJobSuggestionsService(dataSource);

  const activeJobs = [
    { id: "junior-fe", title: "Junior Frontend Developer (React)" },
    { id: "middle-fe", title: "Middle Frontend Developer" },
    { id: "design", title: "UI/UX Designer" },
    { id: "marketing", title: "Recruitment Marketing Specialist" },
  ];

  const event = (
    applicationId: string,
    classificationResult: Record<string, unknown> | null,
  ) => ({ applicationId, classificationResult });

  beforeEach(() => {
    jest.clearAllMocks();
    repos.applications.find.mockImplementation(
      ({ where }: { where: { id: { _value: string[] } } }) =>
        Promise.resolve(where.id._value.map((id) => ({ id }))),
    );
    repos.jobs.find.mockResolvedValue(activeJobs);
  });

  it("offers the jobs an ambiguous email could mean", async () => {
    repos.events.find.mockResolvedValue([
      event("app-1", {
        appliedRole: "Фронтенд девелопер",
        jobMatch: {
          status: "ambiguous",
          candidates: [{ id: "junior-fe" }, { id: "middle-fe" }],
          suggestions: [],
        },
      }),
    ]);

    expect(await service.getForApplications(["app-1"])).toEqual({
      "app-1": {
        applicationId: "app-1",
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
      },
    });
  });

  it("offers AI suggestions, most confident first, when no job was named", async () => {
    repos.events.find.mockResolvedValue([
      event("app-1", {
        appliedRole: null,
        jobMatch: {
          status: "none",
          candidates: [],
          suggestions: [
            {
              jobId: "marketing",
              confidence: "low",
              reason: "Some social media work",
            },
            {
              jobId: "design",
              confidence: "medium",
              reason: "Figma and web design",
            },
          ],
        },
      }),
    ]);

    const result = await service.getForApplications(["app-1"]);

    expect(result["app-1"].status).toBe("none");
    expect(result["app-1"].options).toEqual([
      {
        jobId: "design",
        title: "UI/UX Designer",
        source: "ai",
        confidence: "medium",
        reason: "Figma and web design",
      },
      {
        jobId: "marketing",
        title: "Recruitment Marketing Specialist",
        source: "ai",
        confidence: "low",
        reason: "Some social media work",
      },
    ]);
  });

  it("only offers jobs that are still active, with their current titles", async () => {
    repos.jobs.find.mockResolvedValue([
      { id: "junior-fe", title: "Junior Frontend Developer (React, renamed)" },
    ]);
    repos.events.find.mockResolvedValue([
      event("app-1", {
        jobMatch: {
          status: "ambiguous",
          candidates: [{ id: "junior-fe" }, { id: "closed-job" }],
        },
      }),
    ]);

    const result = await service.getForApplications(["app-1"]);

    expect(result["app-1"].options).toEqual([
      expect.objectContaining({
        jobId: "junior-fe",
        title: "Junior Frontend Developer (React, renamed)",
      }),
    ]);
  });

  it("does not repeat a job that is both an email option and an AI suggestion", async () => {
    repos.events.find.mockResolvedValue([
      event("app-1", {
        jobMatch: {
          status: "ambiguous",
          candidates: [{ id: "design" }, { id: "marketing" }],
          suggestions: [{ jobId: "design", confidence: "high", reason: "x" }],
        },
      }),
    ]);

    const options = (await service.getForApplications(["app-1"]))["app-1"]
      .options;

    expect(options.map((option) => option.jobId)).toEqual([
      "design",
      "marketing",
    ]);
    expect(options[0].source).toBe("email");
  });

  it("uses the latest email for an application", async () => {
    repos.events.find.mockResolvedValue([
      event("app-1", {
        jobMatch: {
          status: "none",
          suggestions: [{ jobId: "design", confidence: "high" }],
        },
      }),
      event("app-1", {
        jobMatch: {
          status: "none",
          suggestions: [{ jobId: "marketing", confidence: "high" }],
        },
      }),
    ]);

    const result = await service.getForApplications(["app-1"]);

    expect(result["app-1"].options.map((option) => option.jobId)).toEqual([
      "design",
    ]);
    expect(repos.events.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: "DESC" } }),
    );
  });

  it.each([
    [
      "an email processed before job matching existed",
      { gate: { decision: "application" } },
    ],
    ["no classification at all", null],
    [
      "nothing left to offer",
      { jobMatch: { status: "none", candidates: [], suggestions: [] } },
    ],
    [
      "only closed jobs",
      { jobMatch: { status: "ambiguous", candidates: [{ id: "closed-job" }] } },
    ],
  ])(
    "leaves out an application with %s",
    async (_case, classificationResult) => {
      repos.events.find.mockResolvedValue([
        event("app-1", classificationResult),
      ]);

      expect(await service.getForApplications(["app-1"])).toEqual({});
    },
  );

  it("only looks at open applications without a job", async () => {
    repos.events.find.mockResolvedValue([]);

    await service.getForApplications(["app-1"]);

    expect(repos.applications.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: In(["app-1"]),
          jobId: IsNull(),
          stage: Not(In([ApplicationStage.HIRED, ApplicationStage.REJECTED])),
        },
      }),
    );
  });

  it("skips applications that already have a job", async () => {
    repos.applications.find.mockResolvedValue([]);

    expect(await service.getForApplications(["app-1"])).toEqual({});
    expect(repos.events.find).not.toHaveBeenCalled();
  });

  it("does not query anything for an empty list", async () => {
    expect(await service.getForApplications([])).toEqual({});
    expect(repos.applications.find).not.toHaveBeenCalled();
  });
});
