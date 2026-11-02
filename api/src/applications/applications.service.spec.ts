import { Logger, UnprocessableEntityException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as mammoth from "mammoth";
import { Readable } from "stream";
import { DataSource } from "typeorm";
import { ApplicationsService } from "./applications.service";
import { Application } from "./entities/application.entity";
import { ApplicationEvent } from "./entities/application-event.entity";
import { ScoreCard } from "./entities/score-card.entity";
import { ApplicationComment } from "./entities/application-comment.entity";
import { CandidateCv } from "../candidate/entities/candidate-cv.entity";
import { Candidate } from "../candidate/entities/candidate.entity";
import { RecruitmentCost } from "../recruitment-costs/entity/recruitment-cost.entity";
import { StorageService } from "../storage/storage.service";
import { MailService } from "../shared/services/mail.service";
import { GenerateRejectionLetterService } from "../llm/tasks/generate-rejection-letter/generate-rejection-letter.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LlmClientService } from "../llm/llm-client.service";
import { AiScreeningService } from "../llm/tasks/ai-screening/ai-screening.service";
import { GenerateScoreCardService } from "../llm/tasks/generate-score-card/generate-score-card.service";

jest.mock("pdf-parse", () => jest.fn());
jest.mock("mammoth", () => ({ extractRawText: jest.fn() }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockPdf = require("pdf-parse") as jest.Mock;
const mockExtractRawText = mammoth.extractRawText as jest.Mock;

describe("ApplicationsService", () => {
  let service: ApplicationsService;

  const mockApplicationRepository = { update: jest.fn() };
  const mockCandidateCvRepository = { find: jest.fn() };
  const mockStorageService = { download: jest.fn() };
  const mockLlmClientService = { runTask: jest.fn() };
  const mockAiScreeningService = { evaluateCandidate: jest.fn() };

  const application = {
    id: "application-1",
    candidateId: "candidate-1",
    job: { title: "Backend Developer", requirements: "NestJS\nPostgreSQL" },
  } as unknown as Application;

  const storedCv = (
    originalFilename: string,
    fileUrl = `cvs/${originalFilename}`,
  ) => ({ originalFilename, fileUrl }) as CandidateCv;

  const filesByKey = (files: Record<string, Buffer>) =>
    mockStorageService.download.mockImplementation((key: string) =>
      Promise.resolve(Readable.from([files[key]])),
    );

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    mockLlmClientService.runTask.mockResolvedValue({ skills: ["NestJS"] });
    mockAiScreeningService.evaluateCandidate.mockResolvedValue({
      matchPercentage: 82,
      recommendation: "proceed",
      summary: "Strong backend match",
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepository,
        },
        { provide: getRepositoryToken(ApplicationEvent), useValue: {} },
        { provide: getRepositoryToken(ScoreCard), useValue: {} },
        { provide: getRepositoryToken(ApplicationComment), useValue: {} },
        {
          provide: getRepositoryToken(CandidateCv),
          useValue: mockCandidateCvRepository,
        },
        { provide: getRepositoryToken(RecruitmentCost), useValue: {} },
        { provide: getRepositoryToken(Candidate), useValue: {} },
        { provide: StorageService, useValue: mockStorageService },
        { provide: MailService, useValue: {} },
        { provide: GenerateRejectionLetterService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: DataSource, useValue: {} },
        { provide: LlmClientService, useValue: mockLlmClientService },
        { provide: AiScreeningService, useValue: mockAiScreeningService },
        { provide: GenerateScoreCardService, useValue: {} },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    jest.spyOn(service, "findOne").mockResolvedValue(application);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("runScreeningFromExistingCv", () => {
    it("should screen a candidate whose latest CV is a DOCX", async () => {
      mockCandidateCvRepository.find.mockResolvedValue([storedCv("cv.docx")]);
      filesByKey({ "cvs/cv.docx": Buffer.from("PK\x03\x04docx") });
      mockExtractRawText.mockResolvedValue({ value: "DOCX CV text" });

      await service.runScreeningFromExistingCv(application.id);

      expect(mockPdf).not.toHaveBeenCalled();
      expect(mockLlmClientService.runTask).toHaveBeenCalledWith(
        expect.anything(),
        { extractedText: "DOCX CV text" },
      );
      expect(mockApplicationRepository.update).toHaveBeenCalledWith(
        application.id,
        expect.objectContaining({ aiScore: 82 }),
      );
    });

    it("should skip non-CV attachments without downloading them", async () => {
      mockCandidateCvRepository.find.mockResolvedValue([
        storedCv("contact.vcf"),
        storedCv("logo.png"),
        storedCv("cv.pdf"),
      ]);
      filesByKey({ "cvs/cv.pdf": Buffer.from("%PDF-1.7") });
      mockPdf.mockResolvedValue({ text: "PDF CV text" });

      await service.runScreeningFromExistingCv(application.id);

      expect(mockStorageService.download).toHaveBeenCalledTimes(1);
      expect(mockStorageService.download).toHaveBeenCalledWith("cvs/cv.pdf");
      expect(mockLlmClientService.runTask).toHaveBeenCalledWith(
        expect.anything(),
        { extractedText: "PDF CV text" },
      );
    });

    it("should detect a nameless stored CV by its bytes", async () => {
      mockCandidateCvRepository.find.mockResolvedValue([
        storedCv("view", "email-ingestion/msg/view"),
      ]);
      filesByKey({
        "email-ingestion/msg/view": Buffer.from("PK\x03\x04docx"),
      });
      mockExtractRawText.mockResolvedValue({ value: "DOCX CV text" });

      await service.runScreeningFromExistingCv(application.id);

      expect(mockExtractRawText).toHaveBeenCalled();
      expect(mockApplicationRepository.update).toHaveBeenCalled();
    });

    it("should re-screen a PDF stored under a name with an unknown extension", async () => {
      mockCandidateCvRepository.find.mockResolvedValue([storedCv("cv.bin")]);
      filesByKey({ "cvs/cv.bin": Buffer.from("%PDF-1.7") });
      mockPdf.mockResolvedValue({ text: "PDF CV text" });

      await service.runScreeningFromExistingCv(application.id);

      expect(mockStorageService.download).toHaveBeenCalledWith("cvs/cv.bin");
      expect(mockLlmClientService.runTask).toHaveBeenCalledWith(
        expect.anything(),
        { extractedText: "PDF CV text" },
      );
    });

    it("should move on to an older CV when the newest one cannot be read", async () => {
      mockCandidateCvRepository.find.mockResolvedValue([
        storedCv("broken.pdf"),
        storedCv("cv.docx"),
      ]);
      filesByKey({
        "cvs/broken.pdf": Buffer.from([0x00, 0xff]),
        "cvs/cv.docx": Buffer.from("PK\x03\x04docx"),
      });
      mockPdf.mockRejectedValue(new Error("Invalid PDF structure"));
      mockExtractRawText.mockResolvedValue({ value: "DOCX CV text" });

      await service.runScreeningFromExistingCv(application.id);

      expect(mockLlmClientService.runTask).toHaveBeenCalledWith(
        expect.anything(),
        { extractedText: "DOCX CV text" },
      );
    });

    it.each([
      ["only a legacy .doc", [storedCv("cv.doc")], {}],
      [
        "a CV with no text",
        [storedCv("empty.docx")],
        { "cvs/empty.docx": Buffer.from("PK\x03\x04") },
      ],
    ])(
      "should reject with 422 and not call the LLM when there is %s",
      async (_label, cvs, files) => {
        mockCandidateCvRepository.find.mockResolvedValue(cvs);
        filesByKey(files);
        mockExtractRawText.mockResolvedValue({ value: "   " });

        await expect(
          service.runScreeningFromExistingCv(application.id),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
        expect(mockLlmClientService.runTask).not.toHaveBeenCalled();
        expect(mockApplicationRepository.update).not.toHaveBeenCalled();
      },
    );

    it("should return the application quietly when the candidate has no CV", async () => {
      mockCandidateCvRepository.find.mockResolvedValue([]);

      await expect(
        service.runScreeningFromExistingCv(application.id),
      ).resolves.toBe(application);
      expect(mockStorageService.download).not.toHaveBeenCalled();
      expect(mockLlmClientService.runTask).not.toHaveBeenCalled();
    });
  });
});
