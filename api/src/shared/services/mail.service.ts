import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { EmailSettingService } from "../../email-setting/email-setting.service";

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

@Injectable()
export class BrevoEmailProvider implements EmailProvider {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>("BREVO_API_KEY");
  }

  async send(options: SendEmailOptions): Promise<void> {
    const fromEmail =
      this.configService.get<string>("EMAIL_FROM") || "hireflow.ic@gmail.com";

    const data = {
      sender: {
        email: fromEmail,
        name: "HireFlow Team",
      },
      to: [{ email: options.to.toLowerCase() }],
      subject: options.subject,
      htmlContent: options.htmlContent,
    };

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Brevo API Error:", errorData);
        throw new InternalServerErrorException("Failed to send email");
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      console.error(
        "❌ Brevo API Error:",
        error instanceof Error ? error.message : error,
      );
      throw new InternalServerErrorException("Failed to send email");
    }
  }
}

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>("RESEND_API_KEY");
    this.resend = new Resend(apiKey);
  }

  async send(options: SendEmailOptions): Promise<void> {
    try {
      const fromEmail =
        this.configService.get<string>("RESEND_FROM_EMAIL") ||
        "HireFlow <onboarding@resend.dev>";

      const { error } = await this.resend.emails.send({
        from: fromEmail,
        to: [options.to.toLowerCase()],
        subject: options.subject,
        html: options.htmlContent,
      });

      if (error) {
        console.error("❌ Resend API Error:", error);
        throw new InternalServerErrorException(
          "Failed to send email via Resend",
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      console.error(
        "❌ Resend Provider Error:",
        error instanceof Error ? error.message : error,
      );
      throw new InternalServerErrorException("Failed to send email");
    }
  }
}

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly brevoProvider: BrevoEmailProvider,
    private readonly resendProvider: ResendEmailProvider,
    private readonly emailSettingService: EmailSettingService,
  ) {}

  async sendEmail(options: SendEmailOptions) {
    const provider = await this.resolveProvider();
    return provider.send(options);
  }

  private async resolveProvider(): Promise<EmailProvider> {
    const providerType = (
      (await this.emailSettingService.getActiveProvider()) ||
      this.configService.get<string>("EMAIL_PROVIDER") ||
      "brevo"
    )
      .trim()
      .toLowerCase();

    return providerType === "resend" ? this.resendProvider : this.brevoProvider;
  }
}
