import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "./entities/job.entity";
import { JobApproval } from "./entities/job-approval.entity";
import { HiringRequestEntity } from "../hiring-request/entities/hiring-request.entity";
import { HiringRequestStatus } from "../hiring-request/enums/hiring-status.enum";
import { GetJobsQueryDto } from "./dto/get-jobs-query.dto";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { UserRole } from "../auth/enums/userRole.enum";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { JobStatus } from "./enums/job-status.enum";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";

interface RawStatusCount {
  status: JobStatus;
  count: string;
}

interface RawJobRow {
  job_id?: string;
  id?: string;
  [key: string]: string | undefined;
}

interface JobWithCount extends Job {
  applicationsCount: number;
}

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobApproval)
    private readonly jobApprovalRepository: Repository<JobApproval>,
    @InjectRepository(HiringRequestEntity)
    private readonly hiringRequestRepository: Repository<HiringRequestEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: GetJobsQueryDto, user: JwtPayload): Promise<any[]> {
    const { status, recruiter_id } = query;

    const qb = this.jobRepository
      .createQueryBuilder("job")
      .leftJoinAndSelect("job.recruiter", "recruiter")
      .leftJoinAndSelect("job.hiringManager", "hiringManager")
      .addSelect(
        '(SELECT COUNT(*) FROM "applications" WHERE "applications"."jobId" = job.id)',
        "job_applications_count",
      )
      .orderBy("job.created_at", "DESC");

    if (status) {
      const statusArray = (Array.isArray(status) ? status : [status]).filter(
        Boolean,
      );
      if (statusArray.length > 0) {
        qb.andWhere("job.status IN (:...statusArray)", { statusArray });
      }
    }

    if (recruiter_id) {
      qb.andWhere("job.recruiterId = :recruiterId", {
        recruiterId: recruiter_id,
      });
    }

    if (user.role === UserRole.HIRING_MANAGER) {
      qb.andWhere("job.hiringManagerId = :hmId", { hmId: user.sub });
    }

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((job) => {
      const rawRow = (raw as RawJobRow[]).find(
        (r) => r.job_id === job.id || r.id === job.id,
      );
      const countKey = rawRow
        ? Object.keys(rawRow).find((key) =>
            key.includes("job_applications_count"),
          )
        : null;

      const applicationsCount =
        rawRow && countKey ? parseInt(rawRow[countKey] ?? "0", 10) || 0 : 0;
      return this.mapJobToResponse({ ...job, applicationsCount });
    });
  }

  async getJobStatusCounts(
    user: JwtPayload,
  ): Promise<Record<JobStatus, number>> {
    const countsQuery = this.jobRepository
      .createQueryBuilder("job")
      .select("job.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("job.status");

    if (user.role === UserRole.HIRING_MANAGER) {
      countsQuery.andWhere("job.hiringManagerId = :hmId", { hmId: user.sub });
    }

    const statusCountsRaw = await countsQuery.getRawMany<RawStatusCount>();

    const statusCounts = statusCountsRaw.reduce<Record<JobStatus, number>>(
      (acc, curr) => {
        acc[curr.status] = parseInt(curr.count, 10);
        return acc;
      },
      {
        [JobStatus.DRAFT]: 0,
        [JobStatus.PENDING_APPROVAL]: 0,
        [JobStatus.ACTIVE]: 0,
        [JobStatus.REJECTED]: 0,
        [JobStatus.CLOSED]: 0,
      } as Record<JobStatus, number>,
    );

    Object.values(JobStatus).forEach((status) => {
      if (!(status in statusCounts)) {
        statusCounts[status] = 0;
      }
    });

    return statusCounts;
  }

  async findOne(id: string): Promise<any> {
    const qb = this.jobRepository
      .createQueryBuilder("job")
      .leftJoinAndSelect("job.recruiter", "recruiter")
      .leftJoinAndSelect("job.hiringManager", "hiringManager")
      .leftJoinAndSelect("job.approvals", "approvals")
      .leftJoinAndSelect("approvals.user", "approvalUser")
      .addSelect(
        '(SELECT COUNT(*) FROM "applications" WHERE "applications"."jobId" = job.id)',
        "job_applications_count",
      )
      .where("job.id = :id", { id });

    const { entities, raw } = await qb.getRawAndEntities();

    if (!entities || entities.length === 0) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const job = entities[0];
    const rawRow = (raw as RawJobRow[])[0] ?? {};
    const countKey = Object.keys(rawRow).find((key) =>
      key.includes("job_applications_count"),
    );
    const applicationsCount = countKey
      ? parseInt(rawRow[countKey] ?? "0", 10) || 0
      : 0;

    return this.mapJobToResponse({ ...job, applicationsCount });
  }

  async create(createJobDto: CreateJobDto, user: JwtPayload): Promise<any> {
    const { hiringRequestId, ...jobData } = createJobDto;

    const jobPayload: Partial<Job> = {
      ...jobData,
      recruiterId: user.sub,
      status: createJobDto.status || JobStatus.DRAFT,
    };

    let hiringRequest: HiringRequestEntity | null = null;
    if (hiringRequestId) {
      hiringRequest = await this.hiringRequestRepository.findOne({
        where: { id: hiringRequestId },
        relations: ["created_by"],
      });

      if (hiringRequest && !createJobDto.department) {
        jobPayload.reasonForOpening = hiringRequest.reason_for_opening;
        jobPayload.rolePurpose = hiringRequest.role_purpose;
        jobPayload.first90DaysGoals = hiringRequest.first_90_days_goals;
      }
    }

    const job = this.jobRepository.create(jobPayload);
    const savedJob = await this.jobRepository.save(job);

    if (hiringRequest) {
      if (hiringRequest?.notes_for_recruiter) {
        interface NoteItem {
          text: string;
        }

        const formattedNotes = Array.isArray(hiringRequest.notes_for_recruiter)
          ? (hiringRequest.notes_for_recruiter as NoteItem[])
              .map((n) => n.text)
              .join("\n")
          : String(hiringRequest.notes_for_recruiter);

        await this.jobApprovalRepository.save(
          this.jobApprovalRepository.create({
            job: savedJob,
            user: {
              id: hiringRequest.created_by_id,
            } as unknown as JobApproval["user"],
            action: "Requested",
            status: savedJob.status,
            notes: formattedNotes,
          }),
        );
      }

      if (hiringRequestId) {
        await this.hiringRequestRepository.update(hiringRequestId, {
          status: HiringRequestStatus.APPROVED,
          job_id: savedJob.id,
        });
      }

      if (hiringRequest.created_by && hiringRequestId) {
        await this.notificationsService.send({
          userId: hiringRequest.created_by_id,
          recipientEmail: hiringRequest.created_by.email,
          type: NotificationType.INFO,
          title: "Hiring Request Status Updated",
          message: `Your hiring request for a ${hiringRequest.job_title} has been approved and a new job has been created.`,
          ctaText: "View Job",
          ctaUrl: `/jobs/${savedJob.id}`,
          metadata: {
            hiringRequestId: hiringRequest.id,
            jobId: savedJob.id,
            status: HiringRequestStatus.APPROVED,
          },
        });
      }
    }
    return this.findOne(savedJob.id);
  }

  async update(id: string, updateJobDto: UpdateJobDto): Promise<any> {
    const job = await this.jobRepository.preload({
      id,
      ...(updateJobDto as Partial<Job>),
    });
    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);
    await this.jobRepository.save(job);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id: id } });
    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);
    await this.jobRepository.remove(job);
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    notes?: string,
  ): Promise<any> {
    const job = await this.jobRepository.findOne({
      where: { id: id },
      relations: ["recruiter", "hiringManager"],
    });
    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);

    const oldStatus = job.status;
    job.status = status;
    await this.jobRepository.save(job);

    if (
      (oldStatus !== JobStatus.PAUSED && status === JobStatus.PAUSED) ||
      (oldStatus !== JobStatus.CLOSED && status === JobStatus.CLOSED)
    ) {
      const message = `The job "${job.title}" has been ${status}.`;
      await this.notificationsService.send({
        userId: job.hiringManagerId,
        recipientEmail: job.hiringManager.email,
        type: NotificationType.INFO,
        title: `Job status updated: ${job.title}`,
        message,
        ctaText: "View Job",
        ctaUrl: `/jobs/${job.id}`,
        metadata: { jobId: job.id },
      });
      await this.notificationsService.send({
        userId: job.recruiterId,
        recipientEmail: job.recruiter.email,
        type: NotificationType.INFO,
        title: `Job status updated: ${job.title}`,
        message,
        ctaText: "View Job",
        ctaUrl: `/jobs/${job.id}`,
        metadata: { jobId: job.id },
      });
    }

    if (
      oldStatus === JobStatus.DRAFT &&
      status === JobStatus.PENDING_APPROVAL
    ) {
      const approval = this.jobApprovalRepository.create({
        job,
        user: { id: job.recruiterId },
        action: "Submitted",
        status: JobStatus.PENDING_APPROVAL,
        notes: notes || "Job submitted for approval",
      });
      await this.jobApprovalRepository.save(approval);
    }

    return this.findOne(id);
  }

  async closeJob(id: string): Promise<any> {
    return this.updateStatus(id, JobStatus.CLOSED);
  }

  async approve(id: string, user: JwtPayload, notes?: string): Promise<any> {
    return this.transitionJobStatus(
      id,
      user,
      JobStatus.ACTIVE,
      "approve",
      notes,
    );
  }

  async reject(id: string, user: JwtPayload, notes?: string): Promise<any> {
    return this.transitionJobStatus(
      id,
      user,
      JobStatus.REJECTED,
      "reject",
      notes,
    );
  }

  private async transitionJobStatus(
    id: string,
    user: JwtPayload,
    targetStatus: JobStatus,
    action: string,
    notes?: string,
  ): Promise<any> {
    const job = await this.jobRepository.findOne({
      where: { id: id },
      relations: ["hiringManager", "recruiter"],
    });

    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);
    if (job.hiringManagerId !== user.sub)
      throw new ForbiddenException(
        "You are not the assigned Hiring Manager for this job",
      );

    if (job.status !== JobStatus.PENDING_APPROVAL)
      throw new BadRequestException(
        `Cannot ${action} a job with status '${job.status}'`,
      );

    job.status = targetStatus;
    await this.jobRepository.save(job);

    const approval = this.jobApprovalRepository.create({
      job,
      user: { id: user.sub },
      action: action.charAt(0).toUpperCase() + action.slice(1) + "ed",
      status: targetStatus,
      notes: notes || null,
    });
    await this.jobApprovalRepository.save(approval);

    if (targetStatus === JobStatus.ACTIVE) {
      await this.notificationsService.send({
        userId: job.hiringManagerId,
        type: NotificationType.INFO,
        title: `The job "${job.title}" is now active!`,
        message:
          "The job post is live and you will be notified of new applications.",
        ctaText: "View Job",
        ctaUrl: `/jobs/${job.id}`,
        metadata: {
          jobId: job.id,
        },
      });
      await this.notificationsService.send({
        userId: job.recruiterId,
        recipientEmail: job.recruiter.email,
        type: NotificationType.INFO,
        title: `The job "${job.title}" is now active!`,
        message: "The job post is live.",
        ctaText: "View Job",
        ctaUrl: `/jobs/${job.id}`,
        metadata: {
          jobId: job.id,
        },
      });
    }

    return this.findOne(id);
  }

  private mapJobToResponse(job: JobWithCount) {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      employmentType: job.employmentType,
      location: job.location,
      requirements: job.requirements,
      niceToHave: job.niceToHave,
      department: job.department,
      headcount: job.headcount,
      expertise_level: job.expertise_level,
      english_level: job.english_level,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      currency: job.currency,
      priority: job.priority,
      reasonForOpening: job.reasonForOpening,
      rolePurpose: job.rolePurpose,
      first90DaysGoals: job.first90DaysGoals,
      status: job.status,
      created_at: job.created_at,
      recruiterId: job.recruiterId,
      recruiter: {
        id: job.recruiter?.id,
        name: job.recruiter?.name,
      },
      hiringManagerId: job.hiringManagerId,
      hiringManager: {
        id: job.hiringManager?.id,
        name: job.hiringManager?.name,
        email: job.hiringManager?.email,
      },
      applicationsCount: job.applicationsCount || 0,
      approvals:
        job.approvals
          ?.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .map((a) => ({
            id: a.id,
            userName: a.user?.name || "System",
            userRole: a.user?.role || "hiring-manager",
            action: a.action,
            status: a.status,
            notes: a.notes,
            createdAt: a.created_at,
          })) || [],
    };
  }
}
