import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { EmailIngestService } from "./email-ingest.service";
import { EmailIngestionEvent } from "./entities/email-ingestion-event.entity";
import { EmailIngestionStatus } from "./enums/email-ingestion-status.enum";
import { Candidate } from "src/candidate/entities/candidate.entity";
import { Application } from "src/applications/entities/application.entity";
import { CandidateCv } from "src/candidate/entities/candidate-cv.entity";
import { StorageService } from "../storage/storage.service";
import { ParseApplicationEmailService } from "../llm/tasks/parse-application-email/parse-application-email.service";
import { ParsedApplicationEmailCandidateInfo } from "../llm/tasks/parse-application-email/interfaces/parse-application-email.interface";
import { LlmClientService } from "src/llm/llm-client.service";
import { AiScreeningService } from "../llm/tasks/ai-screening/ai-screening.service";
import { JobService } from "src/job/job.service";
import { ParsedCvCandidateInfo } from "src/llm/tasks/parse-cv/interfaces/parse-cv.interface";
import { Readable } from "stream";
import { matchApplicationToJobTask } from "src/llm/tasks/match-application-to-job/match-application-to-job.task";

jest.mock("pdf-parse", () => jest.fn());
jest.mock("mammoth", () => ({ extractRawText: jest.fn() }));

describe("EmailIngestService", () => {
  let service: EmailIngestService;

  const mockEventRepository = { findBy: jest.fn(), save: jest.fn() };
  const mockCandidateRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const mockApplicationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockCandidateCvRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const mockStorageService = { upload: jest.fn(), download: jest.fn() };
  const mockDataSource = {
    getRepository: jest.fn(() => ({
      findOne: jest.fn().mockResolvedValue({ source_label: "email" }),
    })),
  };
  const mockParseApplicationEmailService = { parse: jest.fn() };
  const mockLlmClientService = { runTask: jest.fn() };
  const mockAiScreeningService = { evaluateCandidate: jest.fn() };
  const mockJobService = { findAll: jest.fn() };

  let fetchSpy: jest.SpyInstance;

  const buildAnalysis = (
    overrides: Partial<ParsedApplicationEmailCandidateInfo> = {},
  ): ParsedApplicationEmailCandidateInfo => ({
    candidateName: "Jane Doe",
    email: "jane@example.com",
    phone: null,
    appliedRole: null,
    location: null,
    links: [],
    summary: null,
    isApplication: false,
    appliedJobTitles: [],
    ...overrides,
  });

  const buildEvent = (
    attachmentManifest: Record<string, unknown>[] = [],
  ): EmailIngestionEvent =>
    ({
      id: "event-1",
      gmailMessageId: "gmail-1",
      sender: "Jane Doe <jane@example.com>",
      payload: { subject: "Hello", body: "Some text" },
      attachmentManifest,
      status: EmailIngestionStatus.RECEIVED,
    }) as unknown as EmailIngestionEvent;

  const runWith = async (
    analysis: ParsedApplicationEmailCandidateInfo,
    attachmentManifest: Record<string, unknown>[] = [],
  ): Promise<EmailIngestionEvent> => {
    const event = buildEvent(attachmentManifest);
    mockEventRepository.findBy.mockResolvedValue([event]);
    mockParseApplicationEmailService.parse.mockResolvedValue(analysis);

    await service.analyzeEmail([event.id]);

    return event;
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: false, status: 404 } as Response);

    mockEventRepository.save.mockImplementation((event: EmailIngestionEvent) =>
      Promise.resolve(event),
    );
    mockCandidateRepository.findOne.mockResolvedValue(null);
    mockCandidateRepository.create.mockImplementation((data: unknown) => data);
    mockCandidateRepository.save.mockResolvedValue({ id: "candidate-1" });
    mockApplicationRepository.create.mockImplementation(
      (data: unknown) => data,
    );
    mockApplicationRepository.save.mockResolvedValue({ id: "application-1" });
    mockCandidateCvRepository.create.mockImplementation(
      (data: unknown) => data,
    );
    mockCandidateCvRepository.save.mockResolvedValue({});
    mockStorageService.download.mockRejectedValue(new Error("no storage"));
    mockJobService.findAll.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailIngestService,
        {
          provide: getRepositoryToken(EmailIngestionEvent),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: mockCandidateRepository,
        },
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepository,
        },
        {
          provide: getRepositoryToken(CandidateCv),
          useValue: mockCandidateCvRepository,
        },
        { provide: StorageService, useValue: mockStorageService },
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: ParseApplicationEmailService,
          useValue: mockParseApplicationEmailService,
        },
        { provide: LlmClientService, useValue: mockLlmClientService },
        { provide: AiScreeningService, useValue: mockAiScreeningService },
        { provide: JobService, useValue: mockJobService },
      ],
    }).compile();

    service = module.get<EmailIngestService>(EmailIngestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("analyzeEmail — application gate", () => {
    it("should mark an email as not_application when the LLM says false and nothing points otherwise", async () => {
      const event = await runWith(buildAnalysis());

      expect(event.status).toBe(EmailIngestionStatus.NOT_APPLICATION);
      expect(event.classificationResult).toMatchObject({
        isApplication: false,
        gate: { decision: "not_application", signals: [] },
      });
      expect(mockCandidateRepository.save).not.toHaveBeenCalled();
      expect(mockApplicationRepository.save).not.toHaveBeenCalled();
      expect(mockCandidateCvRepository.save).not.toHaveBeenCalled();
      expect(mockLlmClientService.runTask).not.toHaveBeenCalled();
      expect(mockStorageService.download).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should skip an email whose only attachment is not a document", async () => {
      const event = await runWith(buildAnalysis(), [
        {
          filename: "invite.ics",
          contentType: "text/calendar",
          storageKey: "k1",
        },
      ]);

      expect(event.status).toBe(EmailIngestionStatus.NOT_APPLICATION);
      expect(mockCandidateRepository.save).not.toHaveBeenCalled();
      expect(mockStorageService.download).not.toHaveBeenCalled();
    });

    it("should skip a newsletter whose links are neither CVs nor personal profiles", async () => {
      const event = await runWith(
        buildAnalysis({
          links: [
            "https://example.com/newsletter",
            "https://www.linkedin.com/company/example",
          ],
        }),
      );

      expect(event.status).toBe(EmailIngestionStatus.NOT_APPLICATION);
      expect(mockCandidateRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      [
        "document_attachment",
        buildAnalysis(),
        [{ filename: "cv.pdf", contentType: null, storageKey: "k1" }],
      ],
      [
        "document_attachment",
        buildAnalysis(),
        [
          {
            filename: "cv",
            contentType: "application/msword",
            storageKey: "k1",
          },
        ],
      ],
      [
        "cv_link",
        buildAnalysis({ links: ["https://files.example.com/my-resume"] }),
        [],
      ],
      [
        "linkedin_link",
        buildAnalysis({ links: ["https://www.linkedin.com/in/jane"] }),
        [],
      ],
      ["applied_role", buildAnalysis({ appliedRole: "Backend Developer" }), []],
    ])(
      "should process an email the LLM rejected when it has a %s signal",
      async (signal, analysis, attachments) => {
        const event = await runWith(analysis, attachments);

        expect(event.status).toBe(EmailIngestionStatus.CANDIDATE_RESOLVED);
        expect(event.classificationResult).toMatchObject({
          gate: { decision: "application" },
        });
        expect(
          (event.classificationResult as { gate: { signals: string[] } }).gate
            .signals,
        ).toContain(signal);
        expect(mockCandidateRepository.save).toHaveBeenCalled();
        expect(mockApplicationRepository.save).toHaveBeenCalled();
      },
    );

    it.each([
      ["true", true],
      ["null", null],
    ])(
      "should process an email when the LLM says %s",
      async (_label, isApplication) => {
        const event = await runWith(buildAnalysis({ isApplication }));

        expect(event.status).toBe(EmailIngestionStatus.CANDIDATE_RESOLVED);
        expect(event.applicationId).toBe("application-1");
        expect(mockApplicationRepository.save).toHaveBeenCalled();
      },
    );

    it("should mark the event as failed and create nothing when parsing throws", async () => {
      const event = buildEvent();
      mockEventRepository.findBy.mockResolvedValue([event]);
      mockParseApplicationEmailService.parse.mockRejectedValue(
        new Error("LLM unavailable"),
      );

      await service.analyzeEmail([event.id]);

      expect(event.status).toBe(EmailIngestionStatus.FAILED);
      expect(event.errorMessage).toBe("LLM unavailable");
      expect(mockCandidateRepository.save).not.toHaveBeenCalled();
      expect(mockApplicationRepository.save).not.toHaveBeenCalled();
    });
  });

  const buildParsedCv = (
    overrides: Partial<ParsedCvCandidateInfo> = {},
  ): ParsedCvCandidateInfo => ({
    candidateName: null,
    email: null,
    phone: null,
    location: null,
    links: [],
    skills: [],
    experienceSummary: null,
    education: [],
    summary: null,
    ...overrides,
  });

  describe("buildCandidateIdentity", () => {
    const noContacts = buildAnalysis({ candidateName: null, email: null });

    it("prefers the CV contacts when a recruiter forwards someone else's CV", () => {
      const identity = service.buildCandidateIdentity(
        buildAnalysis({ candidateName: "Mariia Venhryniuk", email: null }),
        buildParsedCv({
          candidateName: "Mariia Venhryniuk",
          email: "mariia@example.com",
          phone: "+380501112233",
        }),
        "Andrew Kozak <andrii.kozak@intercode.io>",
      );

      expect(identity).toMatchObject({
        email: "mariia@example.com",
        phone: "+380501112233",
        candidateName: "Mariia Venhryniuk",
        emailSource: "cv",
        nameSource: "cv",
      });
    });

    it("uses the contacts written in a job board notification, not the board's address", () => {
      const identity = service.buildCandidateIdentity(
        buildAnalysis({
          candidateName: "Olena Petrenko",
          email: "olena@example.com",
        }),
        null,
        "Work.ua <noreply@work.ua>",
      );

      expect(identity).toMatchObject({
        email: "olena@example.com",
        candidateName: "Olena Petrenko",
        emailSource: "email",
        nameSource: "email",
      });
    });

    it.each([
      "Work.ua <noreply@work.ua>",
      "DOU <jobs@dou.ua>",
      "Djinni <inbox@djinni.co>",
      "LinkedIn <jobs-listings@linkedin.com>",
      "Company HR <hr@company.com>",
      "notifications@example.com",
    ])("never treats %s as the candidate", (sender) => {
      const identity = service.buildCandidateIdentity(noContacts, null, sender);

      expect(identity.email).toBeNull();
      expect(identity.emailSource).toBeNull();
    });

    it("falls back to the sender when a candidate writes from their own address with no contacts anywhere", () => {
      const identity = service.buildCandidateIdentity(
        noContacts,
        null,
        '"Jane Doe" <jane@example.com>',
      );

      expect(identity).toMatchObject({
        email: "jane@example.com",
        candidateName: "Jane Doe",
        emailSource: "sender",
        nameSource: "sender",
      });
    });

    it("does not borrow the sender's email when the CV has a phone to match on", () => {
      const identity = service.buildCandidateIdentity(
        noContacts,
        buildParsedCv({
          candidateName: "Andrii Vasyliu",
          phone: "+380671234567",
        }),
        "Andrew Kozak <andrii.kozak@intercode.io>",
      );

      expect(identity).toMatchObject({
        email: null,
        phone: "+380671234567",
        candidateName: "Andrii Vasyliu",
        emailSource: null,
        nameSource: "cv",
      });
    });
  });

  describe("analyzeEmail — candidate identity", () => {
    const runForwardedCv = async (parsedCv: ParsedCvCandidateInfo) => {
      const event = buildEvent([
        { filename: "cv.txt", contentType: "text/plain", storageKey: "k1" },
      ]);
      event.sender = "Andrew Kozak <andrii.kozak@intercode.io>";
      mockEventRepository.findBy.mockResolvedValue([event]);
      mockParseApplicationEmailService.parse.mockResolvedValue(
        buildAnalysis({
          candidateName: parsedCv.candidateName,
          email: null,
          isApplication: true,
        }),
      );
      mockStorageService.download.mockResolvedValue(
        Readable.from(["Mariia Venhryniuk, Frontend Developer"]),
      );
      mockLlmClientService.runTask.mockResolvedValue(parsedCv);

      await service.analyzeEmail([event.id]);

      return event;
    };

    it("looks the candidate up by the CV's email, not the forwarder's", async () => {
      const event = await runForwardedCv(
        buildParsedCv({
          candidateName: "Mariia Venhryniuk",
          email: "mariia@example.com",
        }),
      );

      expect(mockCandidateRepository.findOne).toHaveBeenCalledWith({
        where: { email: "mariia@example.com" },
      });
      expect(mockCandidateRepository.findOne).not.toHaveBeenCalledWith({
        where: { email: "andrii.kozak@intercode.io" },
      });
      expect(mockCandidateRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Mariia",
          lastName: "Venhryniuk",
          email: "mariia@example.com",
        }),
      );
      expect(event.classificationResult).toMatchObject({
        identity: { emailSource: "cv", nameSource: "cv" },
      });
    });

    it("saves the CV's skills, phone and LinkedIn even when no job matches", async () => {
      mockCandidateRepository.findOne.mockImplementation(
        ({ where }: { where: { id?: string } }) =>
          Promise.resolve(
            where.id === "candidate-1"
              ? { id: "candidate-1", skills: [], phone: "", linkedinUrl: "" }
              : null,
          ),
      );

      await runForwardedCv(
        buildParsedCv({
          candidateName: "Mariia Venhryniuk",
          email: "mariia@example.com",
          phone: "+380992688092",
          links: ["https://www.linkedin.com/in/mariia"],
          skills: ["React", "TypeScript"],
        }),
      );

      expect(mockJobService.findAll).toHaveBeenCalled();
      expect(mockAiScreeningService.evaluateCandidate).not.toHaveBeenCalled();
      expect(mockCandidateRepository.update).toHaveBeenCalledWith(
        "candidate-1",
        {
          skills: ["React", "TypeScript"],
          phone: "+380992688092",
          linkedinUrl: "https://www.linkedin.com/in/mariia",
        },
      );
    });

    it("creates a separate candidate when nobody's contacts are known, instead of merging into the sender", async () => {
      const event = buildEvent([]);
      event.sender = "Work.ua <noreply@work.ua>";
      mockEventRepository.findBy.mockResolvedValue([event]);
      mockParseApplicationEmailService.parse.mockResolvedValue(
        buildAnalysis({
          candidateName: "Olena Petrenko",
          email: null,
          appliedRole: "QA Engineer",
        }),
      );

      await service.analyzeEmail([event.id]);

      expect(mockCandidateRepository.findOne).not.toHaveBeenCalled();
      const [created] = mockCandidateRepository.create.mock.calls[0] as [
        { firstName: string; lastName: string; email: string },
      ];
      expect(created).toMatchObject({
        firstName: "Olena",
        lastName: "Petrenko",
      });
      expect(created.email).toMatch(/^no-email-\d+@example\.com$/);
    });
  });

  describe("analyzeEmail — current CV", () => {
    it("makes only the email's first document current and resets the older ones", async () => {
      await runWith(buildAnalysis({ isApplication: true }), [
        { filename: "logo.png", contentType: "image/png", storageKey: "k1" },
        {
          filename: "cv.pdf",
          contentType: "application/pdf",
          storageKey: "k2",
        },
        { filename: "letter.pdf", contentType: null, storageKey: "k3" },
      ]);

      expect(mockCandidateCvRepository.update).toHaveBeenCalledWith(
        { candidateId: "candidate-1", isCurrent: true },
        { isCurrent: false },
      );
      expect(
        mockCandidateCvRepository.create.mock.calls.map(
          ([cv]: [{ originalFilename: string; isCurrent: boolean }]) => [
            cv.originalFilename,
            cv.isCurrent,
          ],
        ),
      ).toEqual([
        ["logo.png", false],
        ["cv.pdf", true],
        ["letter.pdf", false],
      ]);
    });

    it("keeps the existing current CV when the email has no document", async () => {
      await runWith(
        buildAnalysis({ isApplication: true, appliedRole: "QA Engineer" }),
        [
          {
            filename: "photo.jpg",
            contentType: "image/jpeg",
            storageKey: "k1",
          },
        ],
      );

      expect(mockCandidateCvRepository.update).not.toHaveBeenCalled();
      expect(mockCandidateCvRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalFilename: "photo.jpg",
          isCurrent: false,
        }),
      );
    });
  });

  describe("analyzeEmail — job matching", () => {
    const jobs = [
      {
        id: "design",
        title: "UI/UX Designer",
        requirements: "Figma\nUser research",
      },
      {
        id: "backend",
        title: "Middle Backend Developer (Node.js / NestJS)",
        requirements: "NestJS\nPostgreSQL",
      },
      {
        id: "junior-fe",
        title: "Junior Frontend Developer (React)",
        requirements: "React\nTypeScript",
      },
      {
        id: "middle-fe",
        title: "Middle Frontend Developer",
        requirements: "React\nArchitecture",
      },
      {
        id: "marketing",
        title: "Recruitment Marketing Specialist",
        requirements: "Job ads\nAnalytics",
      },
    ];

    const runWithCv = async (
      email: { appliedRole?: string | null; appliedJobTitles?: string[] },
      aiSuggestions: {
        jobId: string;
        confidence: string;
        reason: string;
      }[] = [],
    ) => {
      const event = buildEvent([
        { filename: "cv.txt", contentType: "text/plain", storageKey: "k1" },
      ]);
      mockEventRepository.findBy.mockResolvedValue([event]);
      mockParseApplicationEmailService.parse.mockResolvedValue(
        buildAnalysis({ isApplication: true, appliedRole: null, ...email }),
      );
      mockStorageService.download.mockResolvedValue(
        Readable.from(["Graphic designer, Photoshop, Canva"]),
      );
      mockJobService.findAll.mockResolvedValue(jobs);
      mockLlmClientService.runTask.mockImplementation((task: unknown) =>
        Promise.resolve(
          task === matchApplicationToJobTask
            ? aiSuggestions
            : buildParsedCv({
                candidateName: "Artem Savchuk",
                email: "artem@example.com",
              }),
        ),
      );
      mockAiScreeningService.evaluateCandidate.mockResolvedValue({
        matchPercentage: 25,
        recommendation: "reject",
        summary: "Weak fit",
        extractedSkills: [],
      });
      mockApplicationRepository.findOne.mockResolvedValue(null);

      await service.analyzeEmail([event.id]);
      return event;
    };

    const aiWasAskedToMatch = () =>
      mockLlmClientService.runTask.mock.calls.some(
        ([task]) => task === matchApplicationToJobTask,
      );

    it("gives the email parser the titles of the open jobs", async () => {
      await runWithCv({});

      expect(mockParseApplicationEmailService.parse).toHaveBeenCalledWith(
        expect.objectContaining({
          openJobTitles: jobs.map((job) => job.title),
        }),
      );
    });

    it("assigns the job the candidate named, even when AI would pick another one", async () => {
      const event = await runWithCv({ appliedRole: "UI/UX Designer" }, [
        {
          jobId: "marketing",
          confidence: "medium",
          reason: "Canva and social banners",
        },
      ]);

      expect(aiWasAskedToMatch()).toBe(false);
      expect(mockApplicationRepository.update).toHaveBeenCalledWith(
        "application-1",
        { jobId: "design" },
      );
      expect(mockAiScreeningService.evaluateCandidate).toHaveBeenCalledWith(
        "UI/UX Designer",
        ["Figma", "User research"],
        expect.anything(),
      );
      expect(event.classificationResult).toMatchObject({
        jobMatch: { status: "identified", jobId: "design" },
      });
    });

    it("keeps a weak candidate on the job they applied for and lets screening score them", async () => {
      await runWithCv({ appliedRole: "Middle Backend Developer" });

      expect(mockApplicationRepository.update).toHaveBeenCalledWith(
        "application-1",
        { jobId: "backend" },
      );
      expect(mockApplicationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: "backend", aiScore: 25 }),
      );
    });

    it("assigns a translated role that the parser mapped to an open job", async () => {
      await runWithCv({
        appliedRole: "Джуніор фронтенд",
        appliedJobTitles: ["Junior Frontend Developer (React)"],
      });

      expect(mockApplicationRepository.update).toHaveBeenCalledWith(
        "application-1",
        { jobId: "junior-fe" },
      );
    });

    it("leaves an ambiguous application unassigned, lists the options and runs no screening", async () => {
      const event = await runWithCv({
        appliedRole: "Фронтенд девелопер",
        appliedJobTitles: [
          "Junior Frontend Developer (React)",
          "Middle Frontend Developer",
        ],
      });

      expect(aiWasAskedToMatch()).toBe(false);
      expect(mockApplicationRepository.update).not.toHaveBeenCalled();
      expect(mockAiScreeningService.evaluateCandidate).not.toHaveBeenCalled();
      expect(event.classificationResult).toMatchObject({
        jobMatch: {
          status: "ambiguous",
          jobId: null,
          candidates: [
            { id: "junior-fe", title: "Junior Frontend Developer (React)" },
            { id: "middle-fe", title: "Middle Frontend Developer" },
          ],
        },
      });
    });

    it("never assigns a job by AI fit when no job is named, but keeps its suggestions", async () => {
      const event = await runWithCv({ appliedRole: null }, [
        {
          jobId: "marketing",
          confidence: "high",
          reason: "Strong social media experience",
        },
      ]);

      expect(aiWasAskedToMatch()).toBe(true);
      expect(mockApplicationRepository.update).not.toHaveBeenCalled();
      expect(mockAiScreeningService.evaluateCandidate).not.toHaveBeenCalled();
      expect(event.classificationResult).toMatchObject({
        jobMatch: {
          status: "none",
          jobId: null,
          suggestions: [{ jobId: "marketing", confidence: "high" }],
        },
      });
    });

    it("leaves the application unassigned when the named role is not an open job", async () => {
      const event = await runWithCv({ appliedRole: "Data Scientist" });

      expect(mockApplicationRepository.update).not.toHaveBeenCalled();
      expect(event.classificationResult).toMatchObject({
        jobMatch: { status: "none", jobId: null, candidates: [] },
      });
    });

    it("assigns nothing and asks no AI when no jobs are open", async () => {
      mockJobService.findAll.mockResolvedValue([]);
      const event = buildEvent([]);
      mockEventRepository.findBy.mockResolvedValue([event]);
      mockParseApplicationEmailService.parse.mockResolvedValue(
        buildAnalysis({ isApplication: true, appliedRole: "QA Engineer" }),
      );

      await service.analyzeEmail([event.id]);

      expect(aiWasAskedToMatch()).toBe(false);
      expect(mockApplicationRepository.update).not.toHaveBeenCalled();
      expect(event.classificationResult).toMatchObject({
        jobMatch: { status: "none", jobId: null },
      });
    });
  });
});
