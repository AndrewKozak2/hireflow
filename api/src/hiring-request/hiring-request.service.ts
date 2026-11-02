import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { HiringRequestEntity } from "./entities/hiring-request.entity";
import { CreateHiringRequestDto } from "./dto/create-hiring-request.dto";
import { UpdateHiringRequestDto } from "./dto/update-hiring-request.dto";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { HiringRequestStatus } from "./enums/hiring-status.enum";
import { UserEntity } from "../user/entities/user.entity";
import { UserRole } from "../auth/enums/userRole.enum";
import { JobPrefillResponseDto } from "./dto/job-prefill.dto";
import { RejectHiringRequestDto } from "./dto/reject-hiring-request.dto";
import { HiringRequestReviewEntity } from "./entities/hiring-request-review.entity";
import { HiringRequestReviewAction } from "./enums/hiring-request-review-action.enum";
import { AddInternalNoteDto } from "./dto/add-internal-note.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";
import { CreateDraftHiringRequestDto } from "./dto/create-draft-hiring-request.dto";

@Injectable()
export class HiringRequestService {
  constructor(
    @InjectRepository(HiringRequestEntity)
    private readonly hiringRequestRepository: Repository<HiringRequestEntity>,
    @InjectRepository(HiringRequestReviewEntity)
    private readonly hiringRequestReviewRepository: Repository<HiringRequestReviewEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createDraft(dto: CreateDraftHiringRequestDto, user: JwtPayload) {
    const request = this.hiringRequestRepository.create({
      ...dto,
      submitter_email: user.email,
      created_by_id: user.sub,
      status: HiringRequestStatus.DRAFT,
    });
    const saved = await this.hiringRequestRepository.save(request);
    return this.findOne(saved.id, user.role);
  }

  async updateDraft(
    id: string,
    dto: CreateDraftHiringRequestDto,
    user: JwtPayload,
  ) {
    const request = await this.findEntity(id);

    if (request.created_by_id !== user.sub) {
      throw new ForbiddenException("Only the creator can update this draft.");
    }
    if (request.status !== HiringRequestStatus.DRAFT) {
      throw new BadRequestException(
        "Only draft requests can be updated via this endpoint.",
      );
    }

    Object.assign(request, dto);
    const updated = await this.hiringRequestRepository.save(request);
    return this.serializeRequest(updated, false);
  }

  async submitDraft(id: string, dto: CreateHiringRequestDto, user: JwtPayload) {
    const request = await this.findEntity(id);

    if (request.created_by_id !== user.sub) {
      throw new ForbiddenException("Only the creator can submit this draft.");
    }
    if (request.status !== HiringRequestStatus.DRAFT) {
      throw new BadRequestException("Only draft requests can be submitted.");
    }

    Object.assign(request, dto);
    request.status = HiringRequestStatus.PENDING;
    await this.hiringRequestRepository.save(request);
    return this.findOne(id, user.role);
  }

  async deleteDraft(id: string, userId: string): Promise<void> {
    const request = await this.findEntity(id);

    if (request.created_by_id !== userId) {
      throw new ForbiddenException("Only the creator can delete this draft.");
    }
    if (request.status !== HiringRequestStatus.DRAFT) {
      throw new BadRequestException("Only drafts can be deleted.");
    }

    await this.hiringRequestRepository.remove(request);
  }

  async create(dto: CreateHiringRequestDto, user: JwtPayload) {
    const request = this.hiringRequestRepository.create({
      ...dto,
      submitter_email: user.email,
      created_by_id: user.sub,
      status: HiringRequestStatus.PENDING,
    });
    const savedRequest = await this.hiringRequestRepository.save(request);

    const usersToNotify = await this.userRepository.find({
      where: { role: In([UserRole.ADMIN, UserRole.RECRUITER]) },
    });

    for (const userToNotify of usersToNotify) {
      await this.notificationsService.send({
        userId: userToNotify.id,
        recipientEmail: userToNotify.email,
        type: NotificationType.INFO,
        title: "New Hiring Request",
        message: `A new hiring request for a ${dto.job_title} has been submitted.`,
        ctaText: "View Request",
        ctaUrl: `/hiring-requests/${savedRequest.id}`,
        metadata: {
          hiringRequestId: savedRequest.id,
        },
      });
    }

    return this.findOne(savedRequest.id, user.role);
  }

  async update(id: string, dto: UpdateHiringRequestDto, user: JwtPayload) {
    const request = await this.findEntity(id);

    const { notes_for_recruiter, ...generalFields } = dto;
    const hasGeneralFields = Object.keys(generalFields).length > 0;
    const hasNotes = notes_for_recruiter !== undefined;

    const isOwner = request.created_by_id === user.sub;
    const isAdmin = user.role === UserRole.ADMIN;
    const isRecruiter = user.role === UserRole.RECRUITER;

    if (hasGeneralFields) {
      if (!isOwner) {
        throw new ForbiddenException(
          "Only the creator can update the request details.",
        );
      }
      if (request.status !== HiringRequestStatus.PENDING) {
        throw new BadRequestException(
          "Only pending hiring requests can be updated directly.",
        );
      }
    }

    if (hasNotes) {
      if (!isAdmin && !isRecruiter) {
        throw new ForbiddenException(
          "Only admins and recruiters can update notes.",
        );
      }
      if (request.status === HiringRequestStatus.CANCELLED) {
        throw new BadRequestException(
          "Cancelled hiring requests cannot be updated.",
        );
      }
    }

    Object.assign(request, dto);
    const updatedRequest = await this.hiringRequestRepository.save(request);
    return this.serializeRequest(updatedRequest, isAdmin || isRecruiter);
  }

  async addInternalNote(id: string, dto: AddInternalNoteDto, user: JwtPayload) {
    const request = await this.findEntity(id);

    const isAdmin = user.role === UserRole.ADMIN;
    const isRecruiter = user.role === UserRole.RECRUITER;

    if (!isAdmin && !isRecruiter) {
      throw new ForbiddenException(
        "Only admins and recruiters can add internal notes.",
      );
    }

    if (request.status === HiringRequestStatus.CANCELLED) {
      throw new BadRequestException(
        "Cannot add notes to a cancelled hiring request.",
      );
    }

    const dbUser = await this.userRepository.findOne({
      where: { id: user.sub },
    });

    const newNote = {
      id: randomUUID(),
      text: dto.text,
      date_time: new Date().toISOString(),
      author: {
        id: user.sub,
        name:
          dbUser?.name ||
          (user as JwtPayload & { name?: string }).name ||
          this.extractNameFromEmail(user.email),
        role: user.role,
      },
    };

    const existingNotes = Array.isArray(request.notes_for_recruiter)
      ? request.notes_for_recruiter
      : [];

    request.notes_for_recruiter = [...existingNotes, newNote];

    const updatedRequest = await this.hiringRequestRepository.save(request);
    return this.serializeRequest(updatedRequest, true);
  }

  async findAll(
    status?: HiringRequestStatus | HiringRequestStatus[],
    userRole?: UserRole,
  ) {
    const normalizedStatuses = this.normalizeStatuses(status);
    const shouldPrioritizePending =
      normalizedStatuses.length === 0 ||
      (normalizedStatuses.length > 1 &&
        normalizedStatuses.includes(HiringRequestStatus.PENDING));

    const queryBuilder = this.hiringRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.created_by", "created_by")
      .leftJoinAndSelect("request.reports_to", "reports_to")
      .leftJoinAndSelect("request.cancelled_by", "cancelled_by")
      .leftJoinAndSelect("request.assigned_recruiter", "assigned_recruiter");

    if (shouldPrioritizePending) {
      queryBuilder
        .orderBy(
          `CASE WHEN request.status = :pendingStatus THEN 0 ELSE 1 END`,
          "ASC",
        )
        .addOrderBy("request.created_at", "DESC")
        .setParameter("pendingStatus", HiringRequestStatus.PENDING);
    } else {
      queryBuilder.orderBy("request.created_at", "DESC");
    }

    // Drafts are private — exclude from recruiter view; admins can see all drafts
    if (userRole !== UserRole.ADMIN) {
      queryBuilder.andWhere("request.status != :draftStatus", {
        draftStatus: HiringRequestStatus.DRAFT,
      });
    }

    if (normalizedStatuses.length > 0) {
      queryBuilder.andWhere("request.status IN (:...statuses)", {
        statuses: normalizedStatuses,
      });
    }

    const requests = await queryBuilder.getMany();
    return requests.map((request) => this.serializeRequest(request));
  }

  async findMyRequests(userId: string) {
    const requests = await this.hiringRequestRepository.find({
      where: { created_by_id: userId },
      relations: ["created_by", "reports_to"],
      order: { created_at: "DESC" },
    });
    return requests.map((request) => this.serializeRequest(request, false));
  }

  private async findEntity(id: string) {
    const request = await this.hiringRequestRepository.findOne({
      where: { id },
      relations: [
        "created_by",
        "reports_to",
        "cancelled_by",
        "assigned_recruiter",
        "reviews",
        "reviews.reviewer",
      ],
    });

    if (!request) {
      throw new NotFoundException(`Hiring request with ID ${id} not found`);
    }
    return request;
  }

  async findOne(id: string, userRole?: UserRole) {
    const request = await this.findEntity(id);
    const isAdminOrRecruiter =
      userRole === UserRole.ADMIN || userRole === UserRole.RECRUITER;
    return this.serializeRequest(request, isAdminOrRecruiter);
  }

  async takeInReview(id: string, user: JwtPayload) {
    const request = await this.findEntity(id);

    if (request.status !== HiringRequestStatus.PENDING) {
      throw new BadRequestException(
        "Only pending hiring requests can be taken into review",
      );
    }

    request.status = HiringRequestStatus.IN_REVIEW;
    request.assigned_recruiter_id = user.sub;
    await this.hiringRequestRepository.save(request);

    if (request.created_by) {
      await this.notificationsService.send({
        userId: request.created_by_id,
        recipientEmail: request.created_by.email,
        type: NotificationType.INFO,
        title: "Hiring Request Status Updated",
        message: `Your hiring request for a ${request.job_title} is now in review.`,
        ctaText: "View Request",
        ctaUrl: `/hiring-requests/${request.id}`,
        metadata: {
          hiringRequestId: request.id,
          status: HiringRequestStatus.IN_REVIEW,
        },
      });
    }

    return this.findOne(id, user.role);
  }

  async reject(id: string, dto: RejectHiringRequestDto, user: JwtPayload) {
    const request = await this.findEntity(id);
    const canReject = [
      HiringRequestStatus.PENDING,
      HiringRequestStatus.IN_REVIEW,
    ].includes(request.status);

    if (!canReject) {
      throw new BadRequestException(
        "Only pending or in-review hiring requests can be rejected",
      );
    }

    request.status = HiringRequestStatus.REJECTED;
    request.assigned_recruiter_id = null;

    await this.hiringRequestRepository.save(request);
    await this.createReviewRecord(
      request.id,
      user.sub,
      HiringRequestReviewAction.REJECTED,
      dto.reason,
    );

    if (request.created_by) {
      await this.notificationsService.send({
        userId: request.created_by_id,
        recipientEmail: request.created_by.email,
        type: NotificationType.INFO,
        title: "Hiring Request Status Updated",
        message: `Your hiring request for a ${request.job_title} has been rejected.`,
        ctaText: "View Request",
        ctaUrl: `/hiring-requests/${request.id}`,
        metadata: {
          hiringRequestId: request.id,
          status: HiringRequestStatus.REJECTED,
        },
      });
    }

    return this.findOne(id, user.role);
  }

  async resubmit(id: string, dto: UpdateHiringRequestDto, user: JwtPayload) {
    const request = await this.findEntity(id);

    if (request.created_by_id !== user.sub) {
      throw new ForbiddenException(
        "Only the creator can resubmit this hiring request",
      );
    }

    if (request.status !== HiringRequestStatus.REJECTED) {
      throw new BadRequestException(
        "Only rejected hiring requests can be resubmitted",
      );
    }

    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        "At least one field must be changed before resubmitting",
      );
    }

    Object.assign(request, dto);
    request.status = HiringRequestStatus.PENDING;
    request.assigned_recruiter_id = null;

    await this.hiringRequestRepository.save(request);
    await this.createReviewRecord(
      request.id,
      user.sub,
      HiringRequestReviewAction.RESUBMITTED,
      undefined,
      true,
    );

    return this.findOne(id, user.role);
  }

  async cancel(id: string, userId: string) {
    const request = await this.findEntity(id);

    if (request.created_by_id !== userId) {
      throw new ForbiddenException(
        "You do not have permission to cancel this request",
      );
    }

    if (request.status !== HiringRequestStatus.PENDING) {
      throw new BadRequestException("Only pending requests can be cancelled");
    }

    request.status = HiringRequestStatus.CANCELLED;
    request.cancelled_at = new Date();
    request.cancelled_by_id = userId;

    const cancelledRequest = await this.hiringRequestRepository.save(request);
    return this.serializeRequest(cancelledRequest, false);
  }

  private normalizeStatuses(
    status?: HiringRequestStatus | HiringRequestStatus[],
  ): HiringRequestStatus[] {
    const statuses = Array.isArray(status) ? status : status ? [status] : [];
    return statuses.filter((value): value is HiringRequestStatus =>
      Object.values(HiringRequestStatus).includes(value),
    );
  }

  private serializeRequest(
    request: HiringRequestEntity,
    includeRecruiterNotes = true,
  ): HiringRequestEntity {
    const serializedRequest = {
      ...request,
      created_by: this.serializeUserSummary(request.created_by),
      reports_to: this.serializeUserSummary(request.reports_to),
      cancelled_by: this.serializeUserSummary(request.cancelled_by),
      assigned_recruiter: this.serializeUserSummary(request.assigned_recruiter),
      reviews: request.reviews?.map((review) => ({
        ...review,
        reviewer: this.serializeUserSummary(review.reviewer),
      })),
    } as unknown as HiringRequestEntity;

    if (!includeRecruiterNotes) {
      delete serializedRequest.notes_for_recruiter;
    }

    return serializedRequest;
  }

  private serializeUserSummary(user?: UserEntity | null) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name || this.extractNameFromEmail(user.email),
      email: user.email,
    };
  }

  private extractNameFromEmail(email?: string): string {
    if (!email) return "Unknown";
    return email
      .split("@")[0]
      .split(/[.\-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  private async createReviewRecord(
    hiringRequestId: string,
    reviewerId: string,
    action: HiringRequestReviewAction,
    reason?: string,
    shouldIncrementRound = false,
  ) {
    const currentRound = await this.getCurrentReviewRound(hiringRequestId);
    const review = this.hiringRequestReviewRepository.create({
      hiring_request_id: hiringRequestId,
      round: shouldIncrementRound ? currentRound + 1 : currentRound,
      reviewer_id: reviewerId,
      action,
      reason,
    });

    return this.hiringRequestReviewRepository.save(review);
  }

  private async getCurrentReviewRound(hiringRequestId: string) {
    const result = await this.hiringRequestReviewRepository
      .createQueryBuilder("review")
      .select("MAX(review.round)", "round")
      .where("review.hiring_request_id = :hiringRequestId", {
        hiringRequestId,
      })
      .getRawOne<{ round: string | null }>();

    return Number(result?.round ?? 1);
  }

  async getJobPrefill(id: string): Promise<JobPrefillResponseDto> {
    const hiringRequest = await this.hiringRequestRepository.findOne({
      where: { id },
      relations: ["created_by"],
    });
    if (!hiringRequest) {
      throw new NotFoundException(`Hiring request with id "${id}" not found`);
    }
    if (hiringRequest.status !== HiringRequestStatus.IN_REVIEW) {
      throw new BadRequestException(
        `Job prefill is only available for hiring requests with status "in_review". ` +
          `Current status: "${hiringRequest.status}"`,
      );
    }
    const { created_by, department } = hiringRequest;
    const hiringManagerName =
      created_by.name || this.extractNameFromEmail(created_by.email);
    return {
      title: hiringRequest.job_title ?? "",
      description: `Department: ${department}\n`,
      requirements: hiringRequest.key_requirements ?? null,
      location: hiringRequest.location ?? null,
      employment_type: hiringRequest.employment_type ?? null,
      hiring_request_id: hiringRequest.id,
      hiring_manager_id: created_by.id,
      hiring_manager_name: hiringManagerName,
      created_at: hiringRequest.created_at,
      department: hiringRequest.department,
      headcount: hiringRequest.headcount,
      expertise_level: hiringRequest.expertise_level,
      english_level: hiringRequest.english_level,
      salary_min: hiringRequest.salary_min,
      salary_max: hiringRequest.salary_max,
      currency: hiringRequest.currency,
    };
  }
}
