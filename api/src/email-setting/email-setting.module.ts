import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailSourceRuleEntity } from "./entities/email-source-rule.entity";
import { EmailProviderSettingEntity } from "./entities/email-provider-setting.entity";
import { EmailSettingService } from "./email-setting.service";
import { EmailSettingController } from "./email-setting.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailSourceRuleEntity,
      EmailProviderSettingEntity,
    ]),
  ],
  controllers: [EmailSettingController],
  providers: [EmailSettingService],
  exports: [EmailSettingService],
})
export class EmailSettingModule {}
