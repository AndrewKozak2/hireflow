import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
import { NotificationEntity } from "./entities/notification.entity";
import { UserEntity } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { MailService } from "../shared/services/mail.service";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { NotificationEmailStatus } from "./enums/notification-email-status.enum";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(userId: string): Promise<NotificationEntity[]> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.notificationRepository.find({
      where: {
        userId,
        ...(user.notifications_cleared_at
          ? { created_at: MoreThan(user.notifications_cleared_at) }
          : {}),
      },
      order: { created_at: "DESC" },
    });
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const query = this.notificationRepository
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ is_read: true })
      .where("user_id = :userId", { userId })
      .andWhere("is_read = false");

    if (user.notifications_cleared_at) {
      query.andWhere("created_at > :clearedAt", {
        clearedAt: user.notifications_cleared_at,
      });
    }

    const result = await query.execute();
    return { updated: result.affected ?? 0 };
  }

  async clearAll(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.userRepository.update(userId, {
      notifications_cleared_at: new Date(),
    });
  }

  private getGenericEmailTemplate(
    message: string,
    ctaUrl?: string,
    ctaText?: string,
  ): string {
    const clientUrl =
      this.configService.get<string>("CLIENT_URL") ||
      "http://204.13.235.172:1420";
    let buttonHtml = "";
    if (ctaUrl && ctaText) {
      const fullCtaUrl = new URL(ctaUrl, clientUrl).toString();
      buttonHtml = `<p><a href="${fullCtaUrl}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">${ctaText}</a></p>`;
    }

    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <p>${message}</p>
          ${buttonHtml}
        </body>
      </html>
    `;
  }

  async send(dto: SendNotificationDto): Promise<NotificationEntity | null> {
    let notification: NotificationEntity | null = null;
    if (dto.saveToDb !== false) {
      notification = this.notificationRepository.create({
        userId: dto.userId,
        recipient_email: dto.recipientEmail ?? null,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        metadata: dto.metadata,
        email_status: dto.recipientEmail
          ? NotificationEmailStatus.PENDING
          : NotificationEmailStatus.NONE,
      });
    }

    if (dto.recipientEmail) {
      const emailPromise = this.mailService.sendEmail({
        to: dto.recipientEmail,
        subject: dto.title,
        htmlContent:
          dto.htmlContent ||
          this.getGenericEmailTemplate(dto.message, dto.ctaUrl, dto.ctaText),
      });

      const [emailResult] = await Promise.allSettled([emailPromise]);

      if (notification) {
        if (emailResult.status === "fulfilled") {
          notification.email_status = NotificationEmailStatus.SENT;
        } else {
          const error: unknown = emailResult.reason;
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          this.logger.error(
            `❌ External email delivery failure during notification dispatch: ${errorMessage}`,
          );

          notification.email_status = NotificationEmailStatus.FAILED;
          notification.email_error = errorMessage;
        }
      }
    }

    if (notification) {
      try {
        return await this.notificationRepository.save(notification);
      } catch (dbError) {
        this.logger.error(
          `❌ Database failed to save notification: ${dbError}`,
        );
        throw dbError;
      }
    }

    return null;
  }
}
