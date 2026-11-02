import {
  BadRequestException,
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, QueryFailedError, Repository, In } from "typeorm";
import { Readable } from "stream";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import pdf = require("pdf-parse");
import * as mammoth from "mammoth";
import { StorageService } from "../storage/storage.service";
import {
  EmailIngestAttachmentDto,
  EmailIngestItemDto,
  EmailIngestResponseDto,
  EmailIngestResultDto,
} from "./dto/email-ingest.dto";
import { EmailIngestionEvent } from "./entities/email-ingestion-event.entity";
import { Candidate } from "src/candidate/entities/candidate.entity";
import { Application } from "src/applications/entities/application.entity";
import { EmailIngestionStatus } from "./enums/email-ingestion-status.enum";
import { ApplicationStage } from "src/applications/enums/application-stage.enum";
import { EmailSourceRuleEntity } from "src/email-setting/entities/email-source-rule.entity";
import { CandidateCv } from "src/candidate/entities/candidate-cv.entity";
import { ParseApplicationEmailService } from "../llm/tasks/parse-application-email/parse-application-email.service";
import {
  ApplicationEmailAttachmentMetadata,
  ParsedApplicationEmailCandidateInfo,
} from "../llm/tasks/parse-application-email/interfaces/parse-application-email.interface";
import { LlmClientService } from "src/llm/llm-client.service";
import { JobService } from "src/job/job.service";
import { JobStatus } from "src/job/enums/job-status.enum";
import { matchApplicationToJobTask } from "src/llm/tasks/match-application-to-job/match-application-to-job.task";
import { UserRole } from "src/auth/enums/userRole.enum";
import { JwtPayload } from "src/auth/interfaces/jwt-payload.interface";
import {
  MatchedJob,
  MatchApplicationToJobInput,
} from "src/llm/tasks/match-application-to-job/interfaces/match-application-to-job.interface";
import { parseCvTask } from "src/llm/tasks/parse-cv/parse-cv.task";
import { ParsedCvCandidateInfo } from "src/llm/tasks/parse-cv/interfaces/parse-cv.interface";
import { AiScreeningService } from "../llm/tasks/ai-screening/ai-screening.service";
import { AiRecommendation } from "../applications/enums/ai-recommendation.enum";

const MAX_CV_TEXT_CHARS = 40_000;

@Injectable()
export class EmailIngestService {
  private readonly logger = new Logger(EmailIngestService.name);

  constructor(
    @InjectRepository(EmailIngestionEvent)
    private readonly emailIngestionEventRepository: Repository<EmailIngestionEvent>,
    private readonly parseApplicationEmailService: ParseApplicationEmailService,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
    @Inject(LlmClientService)
    private readonly llmClientService: LlmClientService,
    private readonly aiScreeningService: AiScreeningService,
    @Inject(JobService)
    private readonly jobService: JobService,
    @InjectRepository(CandidateCv)
    private readonly candidateCvRepository: Repository<CandidateCv>,
  ) {}

  async processBatch(payload: unknown): Promise<EmailIngestResponseDto> {
    const items = this.extractBatchItems(payload);
    const results: EmailIngestResultDto[] = [];

    for (const item of items) {
      try {
        const receivedAt = item.receivedAt ? new Date(item.receivedAt) : null;
        const duplicate = await this.persistAcceptedItem(item, receivedAt);
        results.push(duplicate);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          const existing = await this.emailIngestionEventRepository.findOne({
            where: { gmailMessageId: item.gmailMessageId },
          });

          if (!existing) {
            throw new InternalServerErrorException(
              "Duplicate email event could not be loaded",
            );
          }

          results.push({
            gmailMessageId: item.gmailMessageId,
            status: "duplicate",
            ingestionEventId: existing.id,
            applicationId: existing.applicationId ?? null,
          });
          continue;
        }

        throw error;
      }
    }

    return { results };
  }

  private async getDomainRule(
    email: string,
  ): Promise<EmailSourceRuleEntity | null> {
    const emailMatch = email.match(/<([^>]+)>/);
    const cleanEmail = emailMatch ? emailMatch[1] : email.trim();
    const domain = cleanEmail.split("@")[1];
    if (!domain) return null;

    const rule = await this.dataSource
      .getRepository(EmailSourceRuleEntity)
      .findOne({
        where: { sender_pattern: `*@${domain}` },
      });

    return rule;
  }

  async handleFullFlow(items: EmailIngestItemDto[]): Promise<void> {
    for (const item of items) {
      try {
        const receivedAt = item.receivedAt ? new Date(item.receivedAt) : null;
        const result = await this.persistAcceptedItem(item, receivedAt);

        if (result.status === "received" && result.ingestionEventId) {
          await this.analyzeEmail([result.ingestionEventId]);
        }
      } catch (error) {
        console.error(
          `[Background Flow] Error processing ${item.gmailMessageId}:`,
          error,
        );
      }
    }
  }

  async analyzeEmail(eventIds: string[]): Promise<void> {
    const events = await this.emailIngestionEventRepository.findBy({
      id: In(eventIds),
    });
    for (const event of events) {
      const rule = await this.getDomainRule(event.sender);
      if (!rule) {
        event.status = EmailIngestionStatus.FAILED;
        event.errorMessage = `Sender domain not allowed: ${event.sender.split("@")[1]}`;
        await this.emailIngestionEventRepository.save(event);
        continue;
      }
      const dbSource = rule.source_label;
      try {
        event.status = EmailIngestionStatus.PROCESSING;
        await this.emailIngestionEventRepository.save(event);

        const payload = event.payload;
        const attachmentManifest = event.attachmentManifest || [];

        const analysis = await this.parseApplicationEmailService.parse({
          subject:
            typeof payload.subject === "string" && payload.subject
              ? payload.subject
              : "No subject",
          body: typeof payload.body === "string" ? payload.body : "",
          attachments: this.toApplicationEmailAttachments(attachmentManifest),
        });

        if (!analysis.email) {
          const emailMatch = event.sender.match(/<([^>]+)>/);
          analysis.email = emailMatch ? emailMatch[1] : event.sender.trim();
        }

        if (!analysis.candidateName) {
          const nameMatch = event.sender.match(/^"?(.*?)"?\s*</);

          if (nameMatch && nameMatch[1].trim()) {
            analysis.candidateName = nameMatch[1].trim();
          } else {
            analysis.candidateName = analysis.email.split("@")[0];
          }
        }
        if (analysis.links && analysis.links.length > 0) {
          const cvLinks = analysis.links.filter(
            (link) =>
              link.toLowerCase().includes(".pdf") ||
              link.toLowerCase().includes(".doc") ||
              link.toLowerCase().includes("cv") ||
              link.toLowerCase().includes("resume"),
          );

          for (const link of cvLinks) {
            try {
              this.logger.log(
                `[EmailIngest] Downloading CV from link: ${link}`,
              );

              const response = await fetch(link);
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const filename =
                  link.split("/").pop()?.split("?")[0] ||
                  `external-cv-${Date.now()}.pdf`;
                const mimeType =
                  response.headers.get("content-type") || "application/pdf";
                const storageKey = `email-ingestion/${event.gmailMessageId}/external-${Date.now()}-${filename}`;

                await this.storageService.upload(
                  {
                    buffer,
                    mimetype: mimeType,
                    originalname: filename,
                    size: buffer.length,
                  },
                  storageKey,
                );

                attachmentManifest.push({
                  filename,
                  contentType: mimeType,
                  size: buffer.length,
                  storageKey,
                });

                event.attachmentManifest = attachmentManifest;
                await this.emailIngestionEventRepository.save(event);
              } else {
                this.logger.warn(
                  `[EmailIngest] The server returned an error while downloading: ${response.status}`,
                );
              }
            } catch (e) {
              this.logger.warn(
                `[EmailIngest] Error downloading CV from link ${link}: ${e}`,
              );
            }
          }
        }

        const extractedText =
          await this.extractTextFromCvAttachments(attachmentManifest);
        let parsedCv: ParsedCvCandidateInfo | null = null;

        if (extractedText) {
          this.logger.log(
            `[EmailIngest] Extracted CV text for event ${event.id}:\n${extractedText}`,
          );

          try {
            parsedCv = await this.llmClientService.runTask(parseCvTask, {
              extractedText,
            });
            this.logger.log(
              `[EmailIngest] Parsed CV info for event ${event.id}: ${JSON.stringify(parsedCv)}`,
            );
          } catch (error) {
            this.logger.warn(
              `[EmailIngest] Failed to parse CV info for event ${event.id}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        } else {
          this.logger.log(
            `[EmailIngest] No extractable CV text found for event ${event.id}`,
          );
        }

        /* if (!analysis.isApplication) {
          event.status = EmailIngestionStatus.NOT_APPLICATION;
          event.classificationResult = analysis;
          await this.emailIngestionEventRepository.save(event);

          continue;
        }
*/
        const candidateId = await this.resolveCandidate(analysis);
        await this.linkAttachmentsToCandidate(candidateId, attachmentManifest);
        const application = await this.createUnassignedApplication(
          candidateId,
          dbSource,
        );

        const allJobs = (await this.jobService.findAll(
          { status: [JobStatus.ACTIVE] },
          { role: UserRole.ADMIN } as JwtPayload,
        )) as MatchApplicationToJobInput["jobs"];

        let bestMatch: MatchedJob | undefined;
        if (allJobs.length > 0) {
          try {
            const matchedJobs = await this.llmClientService.runTask(
              matchApplicationToJobTask,
              {
                candidate: {
                  summary: this.buildCandidateMatchingSummary(
                    analysis.summary,
                    parsedCv,
                    extractedText,
                    analysis.appliedRole,
                  ),
                },
                jobs: allJobs,
              },
            );

            this.logger.log(
              `[EmailIngest] Результат від ШІ: ${JSON.stringify(matchedJobs, null, 2)}`,
            );

            const jobIds = new Set(allJobs.map((job) => job.id));
            bestMatch = matchedJobs.find(
              (match: MatchedJob) =>
                (match.confidence === "high" ||
                  match.confidence === "medium") &&
                jobIds.has(match.jobId),
            );
          } catch (error) {
            this.logger.warn(
              `[EmailIngest] Failed to match application to jobs for event ${event.id}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        } else {
          this.logger.log(
            `[EmailIngest] No active jobs found for event ${event.id}; skipping application matching`,
          );
        }

        if (bestMatch) {
          await this.assignApplicationToJob(
            application.id,
            candidateId,
            bestMatch.jobId,
          );

          const matchedJob = allJobs.find((j) => j.id === bestMatch.jobId);

          if (matchedJob && parsedCv) {
            try {
              const requirementsArray = matchedJob.requirements
                ? matchedJob.requirements
                    .split("\n")
                    .map((r) => r.trim())
                    .filter(Boolean)
                : [];

              const screeningResult =
                await this.aiScreeningService.evaluateCandidate(
                  matchedJob.title,
                  requirementsArray,
                  parsedCv,
                );

              application.jobId = bestMatch.jobId;
              application.aiScore = screeningResult.matchPercentage;
              application.aiRecommendation =
                screeningResult.recommendation as unknown as AiRecommendation;
              application.aiSummary = screeningResult.summary;

              await this.applicationRepository.save(application);

              if (
                screeningResult.extractedSkills &&
                screeningResult.extractedSkills.length > 0
              ) {
                const candidate = await this.candidateRepository.findOne({
                  where: { id: candidateId },
                });
                if (candidate) {
                  const updateData: Partial<Candidate> = {};

                  const mergedSkills = [
                    ...(candidate.skills || []),
                    ...screeningResult.extractedSkills,
                  ];
                  updateData.skills = Array.from(new Set(mergedSkills));

                  if (parsedCv?.phone && !candidate.phone) {
                    updateData.phone = parsedCv.phone;
                  }

                  if (
                    parsedCv?.links &&
                    parsedCv.links.length > 0 &&
                    !candidate.linkedinUrl
                  ) {
                    const linkedin = parsedCv.links.find((l) =>
                      l.includes("linkedin.com"),
                    );
                    if (linkedin) {
                      updateData.linkedinUrl = linkedin;
                    }
                  }
                  await this.candidateRepository.update(
                    candidate.id,
                    updateData,
                  );
                }
              }

              this.logger.log(
                `[EmailIngest] Screening finished for app ${application.id} with score ${screeningResult.matchPercentage}`,
              );
            } catch (error) {
              this.logger.warn(`[EmailIngest] AI Screening failed: ${error}`);
            }
          }
        }

        event.candidateId = candidateId;
        event.applicationId = application.id;
        event.status = EmailIngestionStatus.CANDIDATE_RESOLVED;
        event.classificationResult = analysis;
        await this.emailIngestionEventRepository.save(event);
      } catch (error) {
        event.status = EmailIngestionStatus.FAILED;
        event.errorMessage =
          error instanceof Error ? error.message : String(error);
        await this.emailIngestionEventRepository.save(event);
      }
    }
  }

  private async linkAttachmentsToCandidate(
    candidateId: string,
    attachments: Record<string, unknown>[],
  ) {
    if (!attachments || attachments.length === 0) return;

    for (const attachment of attachments) {
      const cv = this.candidateCvRepository.create({
        candidateId,
        fileUrl:
          typeof attachment.storageKey === "string"
            ? attachment.storageKey
            : "",
        originalFilename:
          typeof attachment.filename === "string"
            ? attachment.filename
            : "attachment",
        isCurrent: true,
      });
      await this.candidateCvRepository.save(cv);
    }
  }

  private toApplicationEmailAttachments(
    attachments: Record<string, unknown>[],
  ): ApplicationEmailAttachmentMetadata[] {
    return attachments.map((attachment) => ({
      filename: this.getAttachmentFilename(attachment),
      contentType:
        typeof attachment.contentType === "string"
          ? attachment.contentType
          : null,
      sizeBytes:
        typeof attachment.sizeBytes === "number"
          ? attachment.sizeBytes
          : typeof attachment.size === "number"
            ? attachment.size
            : null,
    }));
  }

  private buildCandidateMatchingSummary(
    emailSummary: string | null,
    parsedCv: ParsedCvCandidateInfo | null,
    extractedText: string | null,
    appliedRole?: string | null,
  ): string | null {
    const rolePrefix = appliedRole
      ? `[APPLIED EXPLICITLY FOR ROLE: ${appliedRole}]\n---\n`
      : "";
    if (parsedCv) {
      return (
        rolePrefix +
        [
          parsedCv.summary ? `Summary: ${parsedCv.summary}` : null,
          parsedCv.experienceSummary
            ? `Experience: ${parsedCv.experienceSummary}`
            : null,
          parsedCv.skills.length
            ? `Skills: ${parsedCv.skills.join(", ")}`
            : null,
          parsedCv.education.length
            ? `Education: ${parsedCv.education.join("; ")}`
            : null,
          parsedCv.location ? `Location: ${parsedCv.location}` : null,
        ]
          .filter((part): part is string => Boolean(part))
          .join("\n")
      );
    }

    return rolePrefix + (extractedText || emailSummary || "");
  }

  private async extractTextFromCvAttachments(
    attachments: Record<string, unknown>[],
  ): Promise<string | null> {
    if (!attachments || attachments.length === 0) return null;

    const extractedParts: string[] = [];

    for (const attachment of attachments) {
      const textKind = this.getSupportedCvTextKind(attachment);
      if (!textKind) continue;

      const storageKey =
        typeof attachment.storageKey === "string" ? attachment.storageKey : "";
      const filename = this.getAttachmentFilename(attachment);

      if (!storageKey) {
        this.logger.warn(
          `[EmailIngest] Cannot extract CV text from ${filename}: missing storageKey`,
        );
        continue;
      }

      try {
        const stream = await this.storageService.download(storageKey);
        const buffer = await this.streamToBuffer(stream);
        const text = await this.extractTextFromBuffer(buffer, textKind);
        const normalizedText = text.trim();

        if (normalizedText) {
          extractedParts.push(`Filename: ${filename}\n${normalizedText}`);
        }
      } catch (error) {
        this.logger.warn(
          `[EmailIngest] Failed to extract CV text from ${filename}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const extractedText = extractedParts.join("\n\n---\n\n").trim();
    if (!extractedText) return null;

    return extractedText.length > MAX_CV_TEXT_CHARS
      ? extractedText.slice(0, MAX_CV_TEXT_CHARS)
      : extractedText;
  }

  private getSupportedCvTextKind(
    attachment: Record<string, unknown>,
  ): "pdf" | "docx" | "text" | null {
    const filename = this.getAttachmentFilename(attachment).toLowerCase();
    const contentType =
      typeof attachment.contentType === "string"
        ? attachment.contentType.toLowerCase()
        : "";

    if (contentType === "application/pdf" || filename.endsWith(".pdf")) {
      return "pdf";
    }

    if (
      contentType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filename.endsWith(".docx")
    ) {
      return "docx";
    }

    if (contentType.startsWith("text/") || filename.endsWith(".txt")) {
      return "text";
    }

    if (filename.endsWith(".doc")) {
      this.logger.warn(
        `[EmailIngest] Skipping ${filename}: legacy .doc parsing is not supported`,
      );
    }

    return null;
  }

  private getAttachmentFilename(attachment: Record<string, unknown>): string {
    return typeof attachment.filename === "string"
      ? attachment.filename
      : "attachment";
  }

  private async extractTextFromBuffer(
    buffer: Buffer,
    textKind: "pdf" | "docx" | "text",
  ): Promise<string> {
    if (textKind === "text") {
      return buffer.toString("utf8");
    }

    if (textKind === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    try {
      const result = await pdf(buffer);
      return result.text;
    } catch (error) {
      const fallbackText = this.extractTextFallback(buffer);
      if (fallbackText) {
        this.logger.warn(
          `[EmailIngest] PDF parser failed, using UTF-8 text fallback: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return fallbackText;
      }

      throw error;
    }
  }

  private extractTextFallback(buffer: Buffer): string | null {
    const text = buffer.toString("utf8").trim();
    if (!text || text.includes("\u0000")) return null;

    const printableCharacters = text.replace(/[^\x20-\x7E\n\r\t]/g, "");
    if (printableCharacters.length / text.length < 0.8) return null;

    const fullContentMatch = text.match(/fullContent:\s*"([\s\S]*)"\s*}?$/);
    if (fullContentMatch?.[1]) {
      return fullContentMatch[1].trim();
    }

    return text;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const readable = stream as AsyncIterable<Buffer | string>;

    for await (const chunk of readable) {
      chunks.push(
        typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk),
      );
    }

    return Buffer.concat(chunks);
  }

  private async resolveCandidate(
    analysis: ParsedApplicationEmailCandidateInfo,
  ): Promise<string> {
    let candidate = null;
    if (analysis.email) {
      candidate = await this.candidateRepository.findOne({
        where: { email: analysis.email },
      });
    }

    if (!candidate && analysis.phone) {
      candidate = await this.candidateRepository.findOne({
        where: { phone: analysis.phone },
      });
    }

    if (!candidate) {
      const names = analysis.candidateName?.split(" ") || [
        "Unknown",
        "Candidate",
      ];

      const linkedinUrl =
        analysis.links?.find((link) => link.includes("linkedin.com")) || "";

      candidate = this.candidateRepository.create({
        firstName: names[0] || "Unknown",
        lastName: names.slice(1).join(" ") || "Candidate",
        email: analysis.email || `no-email-${Date.now()}@example.com`,
        phone: analysis.phone || "",
        linkedinUrl: linkedinUrl || "",
        isAutoCreated: true,
      });
      candidate = await this.candidateRepository.save(candidate);
    }

    return candidate.id;
  }

  private async createUnassignedApplication(
    candidateId: string,
    sourceFromDb: string,
  ) {
    const application = this.applicationRepository.create({
      candidateId,
      jobId: null,
      source: sourceFromDb || "email",
      stage: ApplicationStage.NEW,
    });

    return this.applicationRepository.save(application);
  }

  private async assignApplicationToJob(
    applicationId: string,
    candidateId: string,
    jobId: string,
  ): Promise<void> {
    const existing = await this.applicationRepository.findOne({
      where: { candidateId, jobId },
    });

    if (existing && existing.id !== applicationId) {
      this.logger.warn(
        `[EmailIngest] Candidate ${candidateId} already has application ${existing.id} for matched job ${jobId}; leaving application ${applicationId} unassigned`,
      );
      return;
    }

    await this.applicationRepository.update(applicationId, { jobId });
  }

  public extractBatchItems(payload: unknown): EmailIngestItemDto[] {
    const source = this.asRecord(payload);

    const rawItems = Array.isArray(payload)
      ? payload
      : Array.isArray(source?.items)
        ? source.items
        : null;

    if (!rawItems) {
      throw new BadRequestException(
        "Request body must be an array or an object with items array",
      );
    }

    return rawItems.map((item, index) => {
      const record = this.asRecord(item);

      const gmailMessageId = this.asRequiredString(
        record?.gmailMessageId,
        `items[${index}].gmailMessageId`,
      );
      const sender = this.asRequiredString(
        record?.sender,
        `items[${index}].sender`,
      );

      const attachments = Array.isArray(record?.attachments)
        ? (record.attachments as EmailIngestAttachmentDto[])
        : undefined;

      return {
        ...(record as Record<string, unknown>),
        gmailMessageId,
        sender,
        threadId:
          typeof record?.threadId === "string" ? record.threadId : undefined,
        forwardedBy:
          typeof record?.forwardedBy === "string"
            ? record.forwardedBy
            : undefined,
        receivedAt:
          typeof record?.receivedAt === "string"
            ? record.receivedAt
            : undefined,
        attachments,
      };
    });
  }

  private async persistAcceptedItem(
    item: EmailIngestItemDto,
    receivedAt: Date | null,
  ): Promise<EmailIngestResultDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const eventRepository =
        queryRunner.manager.getRepository(EmailIngestionEvent);

      const savedEvent = await eventRepository.save(
        eventRepository.create({
          gmailMessageId: item.gmailMessageId,
          sender: item.sender,
          threadId: item.threadId,
          forwardedBy: item.forwardedBy,
          receivedAt,
          payload: item as unknown as Record<string, unknown>,
          attachmentManifest: [],
        } as Partial<EmailIngestionEvent>),
      );

      const attachmentManifest = await this.uploadAttachments(
        item.attachments,
        item.gmailMessageId,
      );

      if (attachmentManifest.length > 0) {
        savedEvent.attachmentManifest = attachmentManifest;
        await eventRepository.save(savedEvent);
      }

      await queryRunner.commitTransaction();

      return {
        gmailMessageId: item.gmailMessageId,
        status: "received",
        ingestionEventId: savedEvent.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async uploadAttachments(
    attachments: EmailIngestAttachmentDto[] | undefined,
    gmailMessageId: string,
  ) {
    if (!attachments?.length) {
      return [];
    }

    const manifest: Record<string, unknown>[] = [];

    for (const [index, attachment] of attachments.entries()) {
      const attachmentBase64 = attachment.contentBase64 ?? attachment.data;

      if (!attachmentBase64) {
        continue;
      }

      const filename =
        attachment.filename ??
        attachment.originalFilename ??
        attachment.name ??
        `attachment-${index + 1}`;
      const mimeType =
        attachment.contentType ??
        attachment.mimeType ??
        "application/octet-stream";
      const buffer = Buffer.from(attachmentBase64, "base64");
      const storageKey = `email-ingestion/${gmailMessageId}/${Date.now()}-${filename}`;

      await this.storageService.upload(
        {
          buffer,
          mimetype: mimeType,
          originalname: filename,
          size:
            typeof attachment.size === "number"
              ? attachment.size
              : buffer.length,
        },
        storageKey,
      );

      manifest.push({
        filename,
        contentType: mimeType,
        size:
          typeof attachment.size === "number" ? attachment.size : buffer.length,
        storageKey,
      });
    }

    return manifest;
  }

  private isUniqueViolation(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === "23505";
  }

  private asRecord(value: unknown) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }

  private asRequiredString(value: unknown, field: string) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException(`${field} must be a non-empty string`);
    }

    return value.trim();
  }
}
