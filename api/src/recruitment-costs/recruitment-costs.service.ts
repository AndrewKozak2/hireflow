import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { RecruitmentCost } from "./entity/recruitment-cost.entity";
import { CreateRecruitmentCostsDto } from "./dto/create-recruitment-costs.dto";
import { UpdateRecruitmentCostDto } from "./dto/update-recruitment-cost.dto";
import { Job } from "../job/entities/job.entity";
import { Application } from "../applications/entities/application.entity";
import { RecruitmentCostCategory } from "./enums/recruitment-cost-category.enum";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { UserRole } from "../auth/enums/userRole.enum";

@Injectable()
export class RecruitmentCostsService {
  constructor(
    @InjectRepository(RecruitmentCost)
    private readonly recruitmentCostRepository: Repository<RecruitmentCost>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly dataSource: DataSource,
  ) {}

  private validateJobAccess(
    job: Job,
    user: JwtPayload,
    readOnly = false,
  ): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (user.role === UserRole.RECRUITER) {
      if (job.recruiterId !== user.sub) {
        throw new ForbiddenException(
          "You only have access to recruitment costs for your owned jobs",
        );
      }
      return;
    }

    if (user.role === UserRole.HIRING_MANAGER) {
      if (!readOnly) {
        throw new ForbiddenException(
          "Hiring managers are not allowed to manage recruitment costs",
        );
      }
      if (job.hiringManagerId !== user.sub) {
        throw new ForbiddenException(
          "You only have read-only access to recruitment costs for your assigned jobs",
        );
      }
      return;
    }

    throw new ForbiddenException("Invalid user role");
  }

  async create(
    jobId: string,
    createDto: CreateRecruitmentCostsDto,
    user: JwtPayload,
  ): Promise<RecruitmentCost[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const job = await queryRunner.manager.findOne(Job, {
        where: { id: jobId },
      });
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      this.validateJobAccess(job, user, false);

      const savedCosts: RecruitmentCost[] = [];

      for (const costDto of createDto.costs) {
        if (costDto.jobId !== jobId) {
          throw new BadRequestException(
            `Job ID in path (${jobId}) does not match Job ID in cost object (${costDto.jobId})`,
          );
        }

        if (
          costDto.category === RecruitmentCostCategory.RECRUITER_COMMISSION ||
          costDto.category === RecruitmentCostCategory.REFERRAL_BONUS
        ) {
          throw new BadRequestException(
            `Automatic categories (${costDto.category}) cannot be created manually`,
          );
        }

        if (
          costDto.automationKey !== undefined &&
          costDto.automationKey !== null
        ) {
          throw new BadRequestException(
            "Manual costs must always have automationKey = null",
          );
        }

        let finalSource: string | null = costDto.source || null;

        if (costDto.category === RecruitmentCostCategory.JOB_POSTING) {
          if (!finalSource || !finalSource.trim()) {
            throw new BadRequestException(
              "Source is required for job_posting category",
            );
          }
        } else if (
          costDto.category === RecruitmentCostCategory.SOURCE_SUCCESS_FEE
        ) {
          if (!costDto.applicationId) {
            throw new BadRequestException(
              "Application ID is required for source_success_fee category",
            );
          }
          const app = await queryRunner.manager.findOne(Application, {
            where: { id: costDto.applicationId },
          });
          if (!app) {
            throw new NotFoundException(
              `Application with ID ${costDto.applicationId} not found`,
            );
          }
          if (app.jobId !== jobId) {
            throw new BadRequestException(
              `Application ${costDto.applicationId} does not belong to job ${jobId}`,
            );
          }
          finalSource = app.source;
        } else if (
          costDto.category === RecruitmentCostCategory.INTERVIEW_PAYMENT
        ) {
          if (!costDto.applicationId) {
            throw new BadRequestException(
              "Application ID is required for interview_payment category",
            );
          }
          const app = await queryRunner.manager.findOne(Application, {
            where: { id: costDto.applicationId },
          });
          if (!app) {
            throw new NotFoundException(
              `Application with ID ${costDto.applicationId} not found`,
            );
          }
          if (app.jobId !== jobId) {
            throw new BadRequestException(
              `Application ${costDto.applicationId} does not belong to job ${jobId}`,
            );
          }
          finalSource = null;
        } else if (costDto.category === RecruitmentCostCategory.OTHER) {
          if (costDto.applicationId) {
            const app = await queryRunner.manager.findOne(Application, {
              where: { id: costDto.applicationId },
            });
            if (!app) {
              throw new NotFoundException(
                `Application with ID ${costDto.applicationId} not found`,
              );
            }
            if (app.jobId !== jobId) {
              throw new BadRequestException(
                `Application ${costDto.applicationId} does not belong to job ${jobId}`,
              );
            }
          }
        }

        const cost = queryRunner.manager.create(RecruitmentCost, {
          ...costDto,
          jobId,
          source: finalSource,
          automationKey: null,
          createdBy: user.sub,
        });

        const savedCost = await queryRunner.manager.save(RecruitmentCost, cost);
        savedCosts.push(savedCost);
      }

      await queryRunner.commitTransaction();
      return savedCosts;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllForJob(
    jobId: string,
    user: JwtPayload,
  ): Promise<{ costs: RecruitmentCost[]; total: number }> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    this.validateJobAccess(job, user, true);

    const costs = await this.recruitmentCostRepository.find({
      where: { jobId },
      order: { incurredAt: "DESC" },
      relations: ["creator", "application", "application.candidate"],
    });

    const total = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
    return { costs, total };
  }

  async findOne(id: string): Promise<RecruitmentCost> {
    const cost = await this.recruitmentCostRepository.findOne({
      where: { id },
    });
    if (!cost) {
      throw new NotFoundException(`Recruitment cost with ID ${id} not found`);
    }
    return cost;
  }

  async update(
    id: string,
    updateDto: UpdateRecruitmentCostDto,
    user: JwtPayload,
  ): Promise<RecruitmentCost> {
    const cost = await this.findOne(id);

    const job = await this.jobRepository.findOne({ where: { id: cost.jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${cost.jobId} not found`);
    }

    this.validateJobAccess(job, user, false);

    if (cost.automationKey !== null) {
      throw new BadRequestException(
        "Automatic costs cannot be updated or deleted",
      );
    }

    if (
      updateDto.category === RecruitmentCostCategory.RECRUITER_COMMISSION ||
      updateDto.category === RecruitmentCostCategory.REFERRAL_BONUS
    ) {
      throw new BadRequestException(
        `Automatic categories (${updateDto.category}) cannot be set manually`,
      );
    }

    const targetJobId = updateDto.jobId || cost.jobId;
    const targetCategory = updateDto.category || cost.category;

    const targetAppId =
      updateDto.applicationId !== undefined
        ? updateDto.applicationId
        : cost.applicationId;

    let finalSource =
      updateDto.source !== undefined ? updateDto.source : cost.source;

    if (updateDto.jobId && updateDto.jobId !== cost.jobId) {
      const jobExists = await this.jobRepository.findOne({
        where: { id: updateDto.jobId },
      });
      if (!jobExists) {
        throw new NotFoundException(`Job with ID ${updateDto.jobId} not found`);
      }
      this.validateJobAccess(jobExists, user, false);
    }

    if (targetCategory === RecruitmentCostCategory.JOB_POSTING) {
      if (!finalSource || !finalSource.trim()) {
        throw new BadRequestException(
          "Source is required for job_posting category",
        );
      }
    } else if (targetCategory === RecruitmentCostCategory.SOURCE_SUCCESS_FEE) {
      if (!targetAppId) {
        throw new BadRequestException(
          "Application ID is required for source_success_fee category",
        );
      }
      const app = await this.applicationRepository.findOne({
        where: { id: targetAppId },
      });
      if (!app) {
        throw new NotFoundException(
          `Application with ID ${targetAppId} not found`,
        );
      }
      if (app.jobId !== targetJobId) {
        throw new BadRequestException(
          `Application ${targetAppId} does not belong to job ${targetJobId}`,
        );
      }
      finalSource = app.source;
    } else if (targetCategory === RecruitmentCostCategory.INTERVIEW_PAYMENT) {
      if (!targetAppId) {
        throw new BadRequestException(
          "Application ID is required for interview_payment category",
        );
      }
      const app = await this.applicationRepository.findOne({
        where: { id: targetAppId },
      });
      if (!app) {
        throw new NotFoundException(
          `Application with ID ${targetAppId} not found`,
        );
      }
      if (app.jobId !== targetJobId) {
        throw new BadRequestException(
          `Application ${targetAppId} does not belong to job ${targetJobId}`,
        );
      }
      finalSource = null;
    }

    Object.assign(cost, updateDto);

    cost.jobId = targetJobId;
    cost.category = targetCategory;
    cost.applicationId = targetAppId;
    cost.source = finalSource;

    await this.recruitmentCostRepository.save(cost);

    return this.findOne(id);
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const cost = await this.findOne(id);
    const job = await this.jobRepository.findOne({ where: { id: cost.jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${cost.jobId} not found`);
    }

    this.validateJobAccess(job, user, false);

    if (cost.automationKey !== null) {
      throw new BadRequestException(
        "Automatic costs cannot be updated or deleted",
      );
    }

    await this.recruitmentCostRepository.remove(cost);
  }
}
