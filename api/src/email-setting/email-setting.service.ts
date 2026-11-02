import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailSourceRuleEntity } from "./entities/email-source-rule.entity";
import { EmailProviderSettingEntity } from "./entities/email-provider-setting.entity";
import { CreateEmailSourceRuleDto } from "./dto/create-email-source-rule.dto";
import { UpdateEmailSourceRuleDto } from "./dto/update-email-source-rule.dto";

@Injectable()
export class EmailSettingService {
  constructor(
    @InjectRepository(EmailSourceRuleEntity)
    private readonly ruleRepository: Repository<EmailSourceRuleEntity>,
    @InjectRepository(EmailProviderSettingEntity)
    private readonly providerSettingRepository: Repository<EmailProviderSettingEntity>,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateEmailSourceRuleDto): Promise<EmailSourceRuleEntity> {
    const existingRule = await this.ruleRepository.findOne({
      where: { sender_pattern: dto.sender_pattern },
    });

    if (existingRule) {
      throw new ConflictException(
        `Rule with pattern "${dto.sender_pattern}" already exists`,
      );
    }

    const newRule = this.ruleRepository.create(dto);
    return await this.ruleRepository.save(newRule);
  }

  async findAll(): Promise<EmailSourceRuleEntity[]> {
    return await this.ruleRepository.find({
      order: { created_at: "DESC" },
    });
  }

  async update(
    id: string,
    dto: UpdateEmailSourceRuleDto,
  ): Promise<EmailSourceRuleEntity> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(
        `Email source rule with ID "${id}" not found`,
      );
    }

    if (dto.sender_pattern) {
      const duplicate = await this.ruleRepository.findOne({
        where: { sender_pattern: dto.sender_pattern },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Rule with pattern "${dto.sender_pattern}" already exists`,
        );
      }
    }

    Object.assign(rule, dto);
    return await this.ruleRepository.save(rule);
  }

  async remove(id: string): Promise<void> {
    const result = await this.ruleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Email source rule with ID "${id}" not found`,
      );
    }
  }

  async getActiveProvider(): Promise<string> {
    const [providerSetting] = await this.providerSettingRepository.find({
      take: 1,
      order: { created_at: "DESC" },
    });

    return (
      providerSetting?.provider ||
      this.configService.get<string>("EMAIL_PROVIDER") ||
      "brevo"
    ).toLowerCase();
  }

  async updateActiveProvider(provider: string): Promise<string> {
    const normalizedProvider = provider.trim().toLowerCase();

    if (!["brevo", "resend"].includes(normalizedProvider)) {
      throw new BadRequestException(
        "Provider must be either 'brevo' or 'resend'.",
      );
    }

    const existingProviderSettings =
      await this.providerSettingRepository.find();

    if (existingProviderSettings.length > 0) {
      await this.providerSettingRepository.remove(existingProviderSettings);
    }

    const providerSetting = this.providerSettingRepository.create({
      provider: normalizedProvider,
    });

    await this.providerSettingRepository.save(providerSetting);

    return providerSetting.provider;
  }
}
