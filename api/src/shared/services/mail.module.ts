import { Global, Module } from "@nestjs/common";
import { EmailSettingModule } from "../../email-setting/email-setting.module";
import {
  MailService,
  BrevoEmailProvider,
  ResendEmailProvider,
} from "./mail.service";

@Global()
@Module({
  imports: [EmailSettingModule],
  providers: [MailService, BrevoEmailProvider, ResendEmailProvider],
  exports: [MailService],
})
export class MailModule {}
