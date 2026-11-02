import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Not, In, EntityManager, DataSource } from "typeorm";
import { Application } from "./entities/application.entity";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationQueryDto } from "./dto/application-query.dto";
import { UpdateApplicationDto } from "./dto/update-application.dto";
import { ApplicationStage } from "./enums/application-stage.enum";
import { ChangeStageDto } from "./dto/change-stage.dto";
import { ApplicationEvent } from "./entities/application-event.entity";
import { ScoreCard } from "./entities/score-card.entity";
import { ApplicationEventType } from "./enums/application-event-type.enum";
//import { ScoreCardRecommendation } from "./enums/score-card-recommendation.enum";
import { JwtPayload } from "src/auth/interfaces/jwt-payload.interface";
import { UserRole } from "src/auth/enums/userRole.enum";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ApplicationComment } from "./entities/application-comment.entity";
import { CandidateCv } from "../candidate/entities/candidate-cv.entity";
import { DeclineOfferDto } from "./dto/decline-offer.dto";
import { MailService } from "../shared/services/mail.service";
import { StorageService, MulterFile } from "../storage/storage.service";
import { decodeUploadedFilename } from "../shared/utils/filename.utils";
import { getRejectionEmailTemplate } from "./templates/rejection-email.template";
import { getGenericEmailTemplate } from "./templates/generic-email.template";
import { SendEmailDto } from "./dto/send-email.dto";
import { GenerateRejectionLetterDto } from "./dto/generate-rejection-letter.dto";
import { GenerateRejectionLetterService } from "../llm/tasks/generate-rejection-letter/generate-rejection-letter.service";
import type { GeneratedRejectionLetterDraft } from "../llm/tasks/generate-rejection-letter/interfaces/generate-rejection-letter.interface";
import { buildRejectionLetterInput } from "./rejection-letter-input.mapper";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";
import { HireApplicationDto } from "./dto/hire-application.dto";
import { RecruitmentCost } from "../recruitment-costs/entity/recruitment-cost.entity";
import { RecruitmentCostCategory } from "../recruitment-costs/enums/recruitment-cost-category.enum";
import { LlmClientService } from "../llm/llm-client.service";
import { parseCvTask } from "../llm/tasks/parse-cv/parse-cv.task";
import { AiScreeningService } from "../llm/tasks/ai-screening/ai-screening.service";
import { Candidate } from "../candidate/entities/candidate.entity";
import { AiRecommendation } from "./enums/ai-recommendation.enum";
import { GenerateScoreCardService } from "../llm/tasks/generate-score-card/generate-score-card.service";
import { InterviewNoteInput } from "../llm/tasks/generate-score-card/interfaces/generate-score-card.interface";
import { ScoreCardRecommendation } from "./enums/score-card-recommendation.enum";
import {
  detectCvTextKind,
  extractCvText,
  isUnsupportedCvFilename,
} from "../shared/utils/cv-text.utils";

const RESCREEN_CV_LOOKBACK = 5;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(ApplicationEvent)
    private readonly applicationEventRepository: Repository<ApplicationEvent>,
    @InjectRepository(ScoreCard)
    private readonly scoreCardRepository: Repository<ScoreCard>,
    @InjectRepository(ApplicationComment)
    private readonly applicationCommentRepository: Repository<ApplicationComment>,
    @InjectRepository(CandidateCv)
    private readonly candidateCvRepository: Repository<CandidateCv>,
    @InjectRepository(RecruitmentCost)
    private readonly recruitmentCostRepository: Repository<RecruitmentCost>,
    private readonly storageService: StorageService,
    private readonly mailService: MailService,
    private readonly generateRejectionLetterService: GenerateRejectionLetterService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    private readonly llmClientService: LlmClientService,
    private readonly aiScreeningService: AiScreeningService,
    private readonly generateScoreCardService: GenerateScoreCardService,
  ) {}

  async create(
    dto: CreateApplicationDto,
    user?: JwtPayload,
  ): Promise<Application> {
    const existing = await this.applicationRepository.findOne({
      where: { candidateId: dto.candidateId, jobId: dto.jobId },
      relations: ["job", "job.recruiter", "job.hiringManager"],
    });

    if (existing) {
      throw new ConflictException(
        "This candidate already has an application for this vacancy",
      );
    }

    const application = this.applicationRepository.create({
      ...dto,
      recruiterId:
        user?.role === UserRole.RECRUITER ? user.sub : dto.recruiterId,
    });
    const savedApplication = await this.applicationRepository.save(application);

    const fullApplication = await this.findOne(savedApplication.id);

    if (fullApplication.job?.recruiter) {
      void this.notificationsService.send({
        userId: fullApplication.job.recruiter.id,
        recipientEmail: fullApplication.job.recruiter.email,
        type: NotificationType.INFO,
        title: "New Application Received",
        message: `A new application has been received for the job: ${fullApplication.job.title}`,
        ctaText: "View Application",
        ctaUrl: `/applications/${fullApplication.id}`,
        metadata: {
          applicationId: fullApplication.id,
        },
      });
    }

    if (fullApplication.job?.hiringManager) {
      void this.notificationsService.send({
        userId: fullApplication.job.hiringManager.id,
        recipientEmail: fullApplication.job.hiringManager.email,
        type: NotificationType.INFO,
        title: "New Application Received",
        message: `A new application has been received for the job: ${fullApplication.job.title}`,
        ctaText: "View Application",
        ctaUrl: `/applications/${fullApplication.id}`,
        metadata: {
          applicationId: fullApplication.id,
        },
      });
    }

    return fullApplication;
  }

  async findAll(query: ApplicationQueryDto, user: JwtPayload) {
    const {
      stage,
      source,
      search,
      jobId,
      candidateId,
      page = 1,
      limit = 25,
    } = query;

    const queryBuilder = this.applicationRepository
      .createQueryBuilder("app")
      .leftJoinAndSelect("app.candidate", "candidate")
      .leftJoinAndSelect("app.job", "job")
      .leftJoinAndSelect("job.hiringManager", "hiringManager")
      .leftJoinAndSelect("job.recruiter", "recruiter");

    if (user.role === UserRole.HIRING_MANAGER) {
      queryBuilder.andWhere("job.hiringManagerId = :userId", {
        userId: user.sub,
      });
    }

    if (stage) {
      const stages = Array.isArray(stage) ? stage : [stage];
      queryBuilder.andWhere("app.stage IN (:...stages)", { stages });
    }

    if (source) {
      const sources = Array.isArray(source) ? source : [source];
      queryBuilder.andWhere("app.source IN (:...sources)", { sources });
    }

    if (jobId) {
      queryBuilder.andWhere("app.jobId = :jobId", { jobId });
    }

    if (candidateId) {
      queryBuilder.andWhere("app.candidateId = :candidateId", { candidateId });
    }

    if (search) {
      queryBuilder.andWhere(
        "(candidate.firstName ILIKE :search OR candidate.lastName ILIKE :search OR job.title ILIKE :search)",
        { search: `%${search}%` },
      );
    }
    queryBuilder.skip((page - 1) * limit).take(limit);

    try {
      const [items, total] = await queryBuilder.getManyAndCount();
      return {
        items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.error("Error in findAll:", err);
      throw err;
    }
  }
  async findOne(id: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: [
        "candidate",
        "candidate.cvs",
        "job",
        "job.hiringManager",
        "job.recruiter",
        "comments",
        "scoreCards",
        "scoreCards.interviewer",
        "comments.author",
        "events",
        "events.actor",
      ],
    });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  async update(id: string, dto: UpdateApplicationDto): Promise<Application> {
    await this.findOne(id);

    const updatedApplication = await this.applicationRepository.preload({
      id,
      ...dto,
    });
    if (!updatedApplication) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return this.applicationRepository.save(updatedApplication);
  }

  async changeStage(id: string, dto: ChangeStageDto, actorId: string) {
    const application = await this.findOne(id);
    const currentStage = application.stage;
    const newStage = dto.stage;

    if (newStage === ApplicationStage.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException("Rejection reason is required");
      }
    } else if (newStage === ApplicationStage.HIRED) {
      if (currentStage !== ApplicationStage.OFFER) {
        throw new BadRequestException("Only from Offer");
      }
    }
    // else if (newStage === ApplicationStage.OFFER) {
    //   const scoreCard = await this.scoreCardRepository.findOne({
    //     where: {
    //       applicationId: id,
    //       recommendation: ScoreCardRecommendation.PROCEED,
    //     },
    //   });
    //   if (!scoreCard)
    //     throw new BadRequestException("Requires PROCEED score card");
    // }
    application.stage = newStage;
    if (dto.rejectionReason) application.rejectionReason = dto.rejectionReason;
    if (dto.rejectionComment) {
      application.rejectionComment = dto.rejectionComment;
    }
    const saved = await this.applicationRepository.save(application);
    await this.createEvent(id, actorId, ApplicationEventType.STAGE_CHANGED, {
      from: currentStage,
      to: newStage,
    });

    if (application.candidate?.email) {
      if (newStage === ApplicationStage.REJECTED && dto.sendEmail) {
        try {
          const candidateName = [
            application.candidate.firstName,
            application.candidate.lastName,
          ]
            .filter(Boolean)
            .join(" ");
          const customEmailMessage = dto.emailMessage?.trim();
          this.logger.log(
            `Sending rejection email for application ${id}; customBody=${Boolean(
              customEmailMessage,
            )}; bodyLength=${customEmailMessage?.length ?? 0}`,
          );
          const htmlContent = customEmailMessage
            ? getGenericEmailTemplate({ body: customEmailMessage })
            : getRejectionEmailTemplate({
                candidateName: candidateName || "Candidate",
                jobTitle: application.job?.title || "the position",
              });
          const subject =
            dto.emailSubject ||
            `Your application for ${application.job?.title || "the position"}`;
          await this.mailService.sendEmail({
            to: application.candidate.email,
            subject,
            htmlContent,
          });
        } catch (emailErr: unknown) {
          const msg =
            emailErr instanceof Error ? emailErr.message : String(emailErr);
          console.error("Failed to send rejection email:", msg);
        }
      }
    }

    if (application.job?.hiringManagerId) {
      void this.notificationsService.send({
        userId: application.job.hiringManagerId,
        type: NotificationType.INFO,
        title: "Application Stage Changed",
        message: `An application for ${application.job.title} has moved to the ${newStage} stage.`,
        ctaText: "View Application",
        ctaUrl: `/applications/${application.id}`,
        metadata: {
          applicationId: application.id,
        },
      });
    }

    return saved;
  }

  private async createEvent(
    applicationId: string,
    actorId: string,
    type: ApplicationEventType,
    payload?: Record<string, unknown>,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(ApplicationEvent)
      : this.applicationEventRepository;
    const event = repo.create({ applicationId, actorId, type, payload });
    return repo.save(event);
  }

  async remove(id: string) {
    const application = await this.findOne(id);
    return this.applicationRepository.softRemove(application);
  }

  async addComment(id: string, dto: CreateCommentDto, authorId: string) {
    const application = await this.findOne(id);
    const comment = this.applicationCommentRepository.create({
      applicationId: id,
      authorId: authorId,
      content: dto.content,
    });

    const savedComment = await this.applicationCommentRepository.save(comment);

    await this.createEvent(id, authorId, ApplicationEventType.COMMENT_ADDED, {
      commentId: savedComment.id,
    });

    if (
      application.job?.recruiterId &&
      application.job.recruiterId !== authorId
    ) {
      void this.notificationsService.send({
        userId: application.job.recruiterId,
        type: NotificationType.INFO,
        title: "New Comment on Application",
        message: `A new comment has been added to an application for ${application.job.title}.`,
        ctaText: "View Comment",
        ctaUrl: `/applications/${application.id}`,
        metadata: {
          applicationId: application.id,
        },
      });
    }

    if (
      application.job?.hiringManagerId &&
      application.job.hiringManagerId !== authorId
    ) {
      void this.notificationsService.send({
        userId: application.job.hiringManagerId,
        type: NotificationType.INFO,
        title: "New Comment on Application",
        message: `A new comment has been added to an application for ${application.job.title}.`,
        ctaText: "View Comment",
        ctaUrl: `/applications/${application.id}`,
        metadata: {
          applicationId: application.id,
        },
      });
    }
    return savedComment;
  }

  async acceptOffer(
    id: string,
    actorId: string,
  ): Promise<{ remainingPipelineCount: number }> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ["job", "job.hiringManager", "candidate"],
    });

    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }

    if (application.stage !== ApplicationStage.OFFER) {
      throw new UnprocessableEntityException(
        "Application must be in OFFER stage to be accepted",
      );
    }

    const oldStage = application.stage;
    application.stage = ApplicationStage.HIRED;
    await this.applicationRepository.save(application);

    await this.createEvent(id, actorId, ApplicationEventType.STAGE_CHANGED, {
      from: oldStage,
      to: ApplicationStage.HIRED,
    });

    if (application.job?.hiringManager?.email) {
      const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
      await this.mailService.sendEmail({
        to: application.job.hiringManager.email,
        subject: "Offer Accepted!",
        htmlContent: `<p>${candidateName} has accepted the offer for <b>${application.job.title}</b>!</p>`,
      });
    }

    const remainingPipelineCount = application.jobId
      ? await this.applicationRepository.count({
          where: {
            jobId: application.jobId,
            stage: Not(In([ApplicationStage.HIRED, ApplicationStage.REJECTED])),
          },
        })
      : 0;

    return { remainingPipelineCount };
  }

  async declineOffer(
    id: string,
    dto: DeclineOfferDto,
    actorId: string,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }

    if (application.stage !== ApplicationStage.OFFER) {
      throw new UnprocessableEntityException(
        "Application must be in OFFER stage to be declined",
      );
    }

    const oldStage = application.stage;
    application.stage = ApplicationStage.REJECTED;
    application.rejectionReason = dto.reason;
    application.rejectionComment = dto.note;

    const saved = await this.applicationRepository.save(application);

    await this.createEvent(id, actorId, ApplicationEventType.STAGE_CHANGED, {
      from: oldStage,
      to: ApplicationStage.REJECTED,
      reason: dto.reason,
    });

    // Email logic for candidate can be added here if dto.sendEmail is true

    return saved;
  }

  async uploadCv(id: string, file: MulterFile, actorId: string) {
    const application = await this.findOne(id);

    const originalFilename = decodeUploadedFilename(file.originalname);
    const fileKey = `cvs/${application.candidateId}/${Date.now()}-${originalFilename}`;
    await this.storageService.upload(file, fileKey);

    await this.candidateCvRepository.update(
      { candidateId: application.candidateId },
      { isCurrent: false },
    );

    const cv = this.candidateCvRepository.create({
      candidateId: application.candidateId,
      fileUrl: fileKey,
      originalFilename,
      isCurrent: true,
    });

    await this.candidateCvRepository.save(cv);

    await this.createEvent(id, actorId, ApplicationEventType.CV_UPLOADED, {
      filename: originalFilename,
    });
    try {
      this.logger.log(
        `[ManualUpload] Starting CV parsing: ${originalFilename}`,
      );

      const textKind = detectCvTextKind({
        filename: originalFilename,
        contentType: file.mimetype,
        buffer: file.buffer,
      });
      const extractedText = textKind
        ? await extractCvText(file.buffer, textKind)
        : "";

      if (extractedText) {
        const parsedCv = await this.llmClientService.runTask(parseCvTask, {
          extractedText,
        });

        if (parsedCv) {
          const updateData: Partial<Candidate> = {};

          if (parsedCv.skills && parsedCv.skills.length > 0) {
            const mergedSkills = [
              ...(application.candidate.skills || []),
              ...parsedCv.skills,
            ];
            updateData.skills = Array.from(new Set(mergedSkills));
            application.candidate.skills = updateData.skills;
          }

          if (parsedCv.phone && !application.candidate.phone) {
            updateData.phone = parsedCv.phone;
          }

          if (
            parsedCv.links &&
            parsedCv.links.length > 0 &&
            !application.candidate.linkedinUrl
          ) {
            const linkedin = parsedCv.links.find((l) =>
              l.includes("linkedin.com"),
            );
            if (linkedin) {
              updateData.linkedinUrl = linkedin;
            }
          }

          if (Object.keys(updateData).length > 0) {
            await this.candidateRepository.update(
              application.candidateId,
              updateData,
            );
          }
        }

        if (application.job) {
          const requirementsArray = application.job.requirements
            ? application.job.requirements
                .split("\n")
                .map((r) => r.trim())
                .filter(Boolean)
            : [];

          if (requirementsArray.length > 0) {
            const screeningResult =
              await this.aiScreeningService.evaluateCandidate(
                application.job.title,
                requirementsArray,
                parsedCv,
              );

            await this.applicationRepository.update(application.id, {
              aiScore: screeningResult.matchPercentage,
              aiRecommendation:
                screeningResult.recommendation as AiRecommendation,
              aiSummary: screeningResult.summary,
            });

            application.aiScore = screeningResult.matchPercentage;
            application.aiRecommendation =
              screeningResult.recommendation as AiRecommendation;
            application.aiSummary = screeningResult.summary;
            this.logger.log(
              `[ManualUpload] AI Screening Complete! Score: ${application.aiScore}`,
            );
          }
        }
      }
    } catch (e) {
      this.logger.warn(
        `[ManualUpload] Error during AI Screening on manual upload: ${e}`,
      );
    }
  }
  async runScreeningFromExistingCv(applicationId: string) {
    const application = await this.findOne(applicationId);

    const candidateCvs = await this.candidateCvRepository.find({
      where: { candidateId: application.candidateId },
      order: { createdAt: "DESC" },
      take: RESCREEN_CV_LOOKBACK,
    });

    if (candidateCvs.length === 0) {
      this.logger.warn(
        `No existing CV found for candidate ${application.candidateId}`,
      );
      return application;
    }

    const extractedText = await this.extractTextFromStoredCvs(candidateCvs);
    if (!extractedText) {
      throw new UnprocessableEntityException(
        "No readable CV (PDF, DOCX or TXT) found for this candidate",
      );
    }

    try {
      const parsedCv = await this.llmClientService.runTask(parseCvTask, {
        extractedText,
      });

      if (application.job && parsedCv) {
        const requirementsArray = application.job.requirements
          ? application.job.requirements
              .split("\n")
              .map((r) => r.trim())
              .filter(Boolean)
          : [];

        if (requirementsArray.length > 0) {
          const screeningResult =
            await this.aiScreeningService.evaluateCandidate(
              application.job.title,
              requirementsArray,
              parsedCv,
            );

          await this.applicationRepository.update(application.id, {
            aiScore: screeningResult.matchPercentage,
            aiRecommendation:
              screeningResult.recommendation as AiRecommendation,
            aiSummary: screeningResult.summary,
          });

          this.logger.log(
            `[Cross-Vacancy] AI Screening Complete! Score: ${screeningResult.matchPercentage}`,
          );
        }
      }
    } catch (e) {
      this.logger.error(`[Cross-Vacancy] Error during AI Screening: ${e}`);
    }

    return this.findOne(applicationId);
  }

  // Email ingestion stores every attachment (logos, cover letters) as a CV, so
  // the newest row is not necessarily a readable CV: use the first one that is.
  private async extractTextFromStoredCvs(
    cvs: CandidateCv[],
  ): Promise<string | null> {
    for (const cv of cvs) {
      if (!cv.fileUrl || isUnsupportedCvFilename(cv.originalFilename)) {
        continue;
      }

      try {
        const stream = await this.storageService.download(cv.fileUrl);
        const chunks: Buffer[] = [];
        for await (const chunk of stream as AsyncIterable<Buffer | string>) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        const textKind = detectCvTextKind({
          filename: cv.originalFilename,
          buffer,
        });
        const text = textKind ? await extractCvText(buffer, textKind) : "";
        if (text) return text;
      } catch (e) {
        this.logger.warn(
          `[Cross-Vacancy] Failed to read CV ${cv.originalFilename}: ${e}`,
        );
      }
    }

    return null;
  }

  async sendEmail(id: string, dto: SendEmailDto, actorId: string) {
    await this.findOne(id);

    const htmlContent = getGenericEmailTemplate({ body: dto.body });

    await this.mailService.sendEmail({
      to: dto.to,
      subject: dto.subject,
      htmlContent,
    });

    try {
      await this.createEvent(id, actorId, ApplicationEventType.EMAIL_SENT, {
        to: dto.to,
        subject: dto.subject,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to log EMAIL_SENT event:", msg);
    }

    return { success: true };
  }
  async generateAiScoreCard(applicationId: string, authorId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ["job", "candidate", "comments", "comments.author"],
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    if (!application.job) {
      throw new BadRequestException(
        "Cannot generate Score Card: Application is not attached to a job.",
      );
    }

    if (!application.comments || application.comments.length === 0) {
      throw new BadRequestException(
        "Cannot generate Score Card: No interview comments found.",
      );
    }

    const interviewNotes: InterviewNoteInput[] = application.comments.map(
      (comment) => ({
        interviewerRole:
          comment.author?.role === UserRole.HIRING_MANAGER
            ? "hiring_manager"
            : "recruiter",
        content: comment.content,
      }),
    );

    const jobRequirements = application.job.requirements
      ? application.job.requirements.split("\n").filter(Boolean)
      : [];

    const candidateResume = `                                                                                                                        
          Skills: ${application.candidate?.skills?.join(", ") || "Not specified"}                                                                        
          Summary: ${application.aiSummary || "No summary available"}                                                                                    
        `;

    const aiResult = await this.generateScoreCardService.generate({
      jobTitle: application.job.title,
      jobRequirements: jobRequirements,
      candidateResume: candidateResume,
      interviewNotes: interviewNotes,
    });

    const scoreCard = this.scoreCardRepository.create({
      applicationId: application.id,
      interviewerId: authorId,
      technicalSkillsScore: aiResult.technicalSkillsScore,
      problemSolvingScore: aiResult.problemSolvingScore,
      communicationScore: aiResult.communicationScore,
      teamFitScore: aiResult.teamFitScore,

      recommendation: aiResult.recommendation as ScoreCardRecommendation,

      comment: aiResult.summaryComment || "",
    });

    return this.scoreCardRepository.save(scoreCard);
  }

  async generateRejectionLetterDraft(
    id: string,
    dto: GenerateRejectionLetterDto,
    user: JwtPayload,
  ): Promise<GeneratedRejectionLetterDraft> {
    const application = await this.findOne(id);
    this.assertCanAccessRejectionLetterDraft(application, user);

    const scoreCards = await this.scoreCardRepository.find({
      where: { applicationId: id },
      relations: ["interviewer"],
      order: { createdAt: "ASC" },
    });
    const sender = this.getRejectionLetterSender(application, user);

    const input = buildRejectionLetterInput(application, scoreCards, {
      tone: dto.tone,
      rejectionReason: dto.rejectionReason,
      rejectionComment: dto.rejectionComment,
      senderName: sender.name,
      senderRole: sender.role,
      companyName: "HireFlow",
    });

    this.logger.log(
      `Rejection letter LLM input for application ${id}: ${JSON.stringify(input)}`,
    );

    const draft = await this.generateRejectionLetterService.generate(input);
    this.logger.log(
      `Generated rejection letter draft for application ${id}: ${JSON.stringify(draft)}`,
    );

    return draft;
  }

  private getRejectionLetterSender(
    application: Application,
    user: JwtPayload,
  ): { name: string | null; role: string | null } {
    if (user.role === UserRole.HIRING_MANAGER) {
      return {
        name: application.job?.hiringManager?.name ?? null,
        role: "Hiring Manager",
      };
    }

    if (user.role === UserRole.RECRUITER) {
      return {
        name: application.job?.recruiter?.name ?? null,
        role: "Recruiter",
      };
    }

    return {
      name:
        application.job?.recruiter?.name ??
        application.job?.hiringManager?.name ??
        null,
      role: "Recruiting Team",
    };
  }

  private assertCanAccessRejectionLetterDraft(
    application: Application,
    user: JwtPayload,
  ): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.RECRUITER) {
      const ownsApplication = application.recruiterId === user.sub;
      const ownsJob = application.job?.recruiterId === user.sub;

      if (ownsApplication || ownsJob) {
        return;
      }
    }

    if (
      user.role === UserRole.HIRING_MANAGER &&
      application.job?.hiringManagerId === user.sub
    ) {
      return;
    }

    throw new ForbiddenException(
      "You do not have access to generate a rejection letter for this application",
    );
  }

  async getCounts(query: ApplicationQueryDto, user: JwtPayload) {
    const { search, jobId } = query;

    const statsBuilder = this.applicationRepository
      .createQueryBuilder("app")
      .leftJoin("app.job", "job")
      .leftJoin("app.candidate", "candidate");

    if (user.role === UserRole.HIRING_MANAGER) {
      statsBuilder.andWhere("job.hiringManagerId = :userId", {
        userId: user.sub,
      });
    }

    if (jobId) {
      statsBuilder.andWhere("app.jobId = :jobId", { jobId });
    }

    if (search) {
      statsBuilder.andWhere(
        "(candidate.firstName ILIKE :search OR candidate.lastName ILIKE :search OR job.title ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    try {
      const [stageStats, sourceStats] = await Promise.all([
        statsBuilder
          .clone()
          .select("app.stage", "stage")
          .addSelect("COUNT(app.id)", "count")
          .groupBy("app.stage")
          .getRawMany<{ stage: string; count: string }>(),

        statsBuilder
          .clone()
          .select("app.source", "source")
          .addSelect("COUNT(app.id)", "count")
          .groupBy("app.source")
          .getRawMany<{ source: string; count: string }>(),
      ]);

      const counts = {
        all: 0,
        new: 0,
        unmatched: 0,
        djinni: 0,
        dou: 0,
        linkedin: 0,
        manual: 0,
        referral: 0,
        talent_pool: 0,
      };

      stageStats.forEach((stat) => {
        if (stat.stage === "new") counts.new = parseInt(stat.count, 10);
        if (stat.stage === "unmatched")
          counts.unmatched = parseInt(stat.count, 10);
      });

      sourceStats.forEach((stat) => {
        if (stat.source && stat.source in counts) {
          counts[stat.source as keyof typeof counts] = parseInt(stat.count, 10);
        }
      });

      counts.all = stageStats.reduce(
        (sum, stat) => sum + parseInt(stat.count, 10),
        0,
      );

      return counts;
    } catch (err) {
      console.error("Error in getCounts:", err);
      throw err;
    }
  }

  async hire(
    id: string,
    dto: HireApplicationDto,
    user: JwtPayload,
  ): Promise<Application> {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id },
        relations: ["job", "job.hiringManager", "candidate"],
      });

      if (!application) {
        throw new NotFoundException(`Application ${id} not found`);
      }

      if (application.stage !== ApplicationStage.OFFER) {
        throw new UnprocessableEntityException(
          "Application must be in OFFER stage to be hired",
        );
      }

      if (
        user.role === UserRole.RECRUITER &&
        application.job?.recruiterId !== user.sub
      ) {
        throw new ForbiddenException(
          "You do not have access to hire candidates for this job",
        );
      }

      // Transition stage and persist salary/commission fields
      application.stage = ApplicationStage.HIRED;
      application.actualMonthlySalary = dto.actualMonthlySalary;
      application.salaryCurrency = dto.currency;
      application.recruiterCommissionPercent = dto.commissionPercent;
      await manager.save(application);

      const actorId = user.sub;

      await this.createEvent(
        id,
        actorId,
        ApplicationEventType.STAGE_CHANGED,
        { from: ApplicationStage.OFFER, to: ApplicationStage.HIRED },
        manager,
      );

      if (!application.jobId) {
        throw new BadRequestException(
          "Cannot create recruitment costs for application without job",
        );
      }

      const commissionKey = `hire:${id}:recruiter_commission`;
      const existingCommission = await manager.findOne(RecruitmentCost, {
        where: { automationKey: commissionKey },
      });
      if (!existingCommission) {
        const commissionAmount = Number(
          ((dto.actualMonthlySalary * dto.commissionPercent) / 100).toFixed(2),
        );
        await manager.save(
          RecruitmentCost,
          manager.create(RecruitmentCost, {
            jobId: application.jobId,
            applicationId: id,
            category: RecruitmentCostCategory.RECRUITER_COMMISSION,
            title: "Recruiter Commission",
            amount: commissionAmount,
            currency: dto.currency,
            incurredAt: new Date(),
            createdBy: actorId,
            automationKey: commissionKey,
          }),
        );
      }

      if (
        application.source === "referral" &&
        dto.referralBonus != null &&
        dto.referralBonus > 0
      ) {
        const referralKey = `hire:${id}:referral_bonus`;
        const existingReferral = await manager.findOne(RecruitmentCost, {
          where: { automationKey: referralKey },
        });
        if (!existingReferral) {
          await manager.save(
            RecruitmentCost,
            manager.create(RecruitmentCost, {
              jobId: application.jobId,
              applicationId: id,
              category: RecruitmentCostCategory.REFERRAL_BONUS,
              title: "Referral Bonus",
              amount: dto.referralBonus,
              currency: dto.currency,
              incurredAt: new Date(),
              createdBy: actorId,
              automationKey: referralKey,
            }),
          );
        }
      }

      return application;
    });
  }
}
