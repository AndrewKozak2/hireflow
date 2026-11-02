import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Candidate } from "./entities/candidate.entity";
import { CandidateCv } from "./entities/candidate-cv.entity";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import { UpdateCandidateDto } from "./dto/update-candidate.dto";
import { CandidateQueryDto } from "./dto/candidate-query.dto";
import { StorageService } from "../storage/storage.service";
import { decodeUploadedFilename } from "../shared/utils/filename.utils";

export interface FileUpload {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(CandidateCv)
    private readonly candidateCvRepository: Repository<CandidateCv>,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateCandidateDto): Promise<Candidate> {
    const existing = await this.candidateRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Candidate with email ${dto.email} already exists`,
      );
    }

    const candidate = this.candidateRepository.create(dto);
    return this.candidateRepository.save(candidate);
  }

  async findAll(query: CandidateQueryDto) {
    const { search, page = 1, limit = 25 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.candidateRepository
      .createQueryBuilder("candidate")
      .orderBy("candidate.createdAt", "DESC")
      .addOrderBy("candidate.id", "ASC")
      .take(limit)
      .skip(skip);

    if (search) {
      queryBuilder.where(
        `candidate.firstName ILIKE :search
          OR candidate.lastName ILIKE :search
          OR candidate.email ILIKE :search
          OR CONCAT(candidate.firstName, ' ', candidate.lastName) ILIKE :search`,
        { search: `%${search}%` },
      );
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
    };
  }

  async findOne(id: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ["cvs"],
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    if (candidate.cvs) {
      candidate.cvs.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }

    return candidate;
  }

  async update(id: string, dto: UpdateCandidateDto) {
    const candidate = await this.findOne(id);

    if (dto.email && dto.email !== candidate.email) {
      const existing = await this.candidateRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException("Email already exists");
    }

    Object.assign(candidate, dto);
    return this.candidateRepository.save(candidate);
  }

  async updateSkills(id: string, skillNames: string[]) {
    const candidate = await this.findOne(id);
    candidate.skills = skillNames;
    return this.candidateRepository.save(candidate);
  }

  async uploadCv(id: string, file: FileUpload) {
    const candidate = await this.findOne(id);
    const originalFilename = decodeUploadedFilename(file.originalname);
    const fileKey = `cvs/${candidate.id}/${Date.now()}-${originalFilename}`;

    await this.storageService.upload(file, fileKey);

    await this.candidateCvRepository.update(
      { candidateId: candidate.id },
      { isCurrent: false },
    );

    const cv = this.candidateCvRepository.create({
      candidateId: candidate.id,
      originalFilename,
      fileUrl: fileKey,
      isCurrent: true,
    });

    await this.candidateCvRepository.save(cv);

    return this.getCvHistory(candidate.id);
  }

  async getCvDownloadUrl(candidateId: string, cvId: string) {
    const cv = await this.candidateCvRepository.findOne({
      where: {
        id: cvId,
        candidateId,
      },
    });

    if (!cv) {
      throw new NotFoundException(`CV with ID ${cvId} not found`);
    }

    const url = await this.storageService.getPresignedUrl(cv.fileUrl);

    return { url };
  }

  private getCvHistory(candidateId: string) {
    return this.candidateCvRepository.find({
      where: { candidateId },
      order: { createdAt: "DESC" },
    });
  }
}
