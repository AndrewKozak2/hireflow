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
  const mockApplicationRepository = { create: jest.fn(), save: jest.fn() };
  const mockCandidateCvRepository = { create: jest.fn(), save: jest.fn() };
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
});
