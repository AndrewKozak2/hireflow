import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import * as bcrypt from "bcrypt";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_EXPIRES_IN,
} from "./constants/auth.constants";
import { PasswordResetToken } from "./entities/forgot-password.entity";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { UserService } from "../user/user.service";
import { UserEntity as User } from "../user/entities/user.entity";

import { MailService } from "../shared/services/mail.service";
import { InvitationEntity } from "../auth/entities/invitation.entity";
import { Repository, IsNull } from "typeorm";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { InviteDto } from "./dto/invite.dto";
import { v4 as uuidv4 } from "uuid";
import { getInviteEmailTemplate } from "./templates/invite.template";
import { UserStatus } from "../auth/enums/userStatus.enum";
import { getResetPasswordEmailTemplate } from "./templates/reset-password.template";
import { UserProfileResponseDto } from "./dto/user-profile-response.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/enums/notification-type.enum";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepo: Repository<PasswordResetToken>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async login(
    dto: LoginDto,
    response: Response,
  ): Promise<{
    accessToken: string;
  }> {
    const { email, password } = dto;

    const user = await this.validateUser(email, password);
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    this.setRefreshCookie(response, refreshToken);

    return { accessToken };
  }

  async refresh(payload: JwtPayload): Promise<{ accessToken: string }> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Your account has been deactivated");
    }

    return {
      accessToken: await this.signAccessToken(user),
    };
  }

  logout(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      path: "/auth",
    });
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException("Invalid credentials");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException("Your account has been deactivated");
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      throw new BadRequestException("Invalid credentials");
    }

    return user;
  }

  private async signAccessToken(user: User): Promise<string> {
    return this.jwtService.signAsync(this.buildPayload(user), {
      secret:
        this.configService.getOrThrow<string>("JWT_ACCESS_SECRET") ??
        "access-secret",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  private async signRefreshToken(user: User): Promise<string> {
    return this.jwtService.signAsync(this.buildPayload(user), {
      secret:
        this.configService.getOrThrow<string>("JWT_REFRESH_SECRET") ??
        "refresh-secret",
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  private buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  }

  async forgotPassword(dto: ForgotPasswordDto, origin?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      // Intentionally silent: do not reveal whether the email exists (prevents user enumeration)
      return;
    }

    await this.tokenRepo.delete({ userId: user.id });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.tokenRepo.save({ token, userId: user.id, expiresAt });
    await this.sendResetEmail(user.email, token, origin);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await this.tokenRepo.findOne({
      where: { token: dto.token },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(record.userId, {
      password_hash: passwordHash,
    });
    await this.tokenRepo.delete({ token: dto.token });
  }

  private async sendResetEmail(
    email: string,
    token: string,
    origin?: string,
  ): Promise<void> {
    const clientUrl =
      origin ||
      this.configService.get("CLIENT_URL") ||
      "http://204.13.235.172:1420";
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;
    try {
      await this.mailService.sendEmail({
        to: email,
        subject: "Reset your HireFlow password",
        htmlContent: getResetPasswordEmailTemplate(resetUrl),
      });
    } catch (error) {
      console.error("Failed to send reset email:", error);
    }
  }

  async createInvitation(
    dto: InviteDto,
    adminId: string,
    origin?: string,
  ): Promise<InvitationEntity> {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException(
        "An account with this email already exists",
      );
    }

    const existingInvite = await this.invitationRepository.findOne({
      where: { email: dto.email, accepted_at: IsNull() },
    });

    if (existingInvite && existingInvite.role !== dto.role) {
      throw new BadRequestException(
        "An invitation for this email with a different role already exists. Please use the 'resend' option if you want to send it again for the same role.",
      );
    }

    const invitation =
      existingInvite || this.invitationRepository.create({ email: dto.email });

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    invitation.token = token;
    invitation.expires_at = expiresAt;
    invitation.role = dto.role;
    invitation.invited_by = { id: adminId } as User;

    const savedInvitation = await this.invitationRepository.save(invitation);

    try {
      const clientUrl =
        origin ||
        this.configService.get("CLIENT_URL") ||
        "http://204.13.235.172:1420";
      const inviteUrl = `${clientUrl}/accept-invite?token=${savedInvitation.token}`;

      await this.notificationsService.send({
        userId: adminId,
        recipientEmail: savedInvitation.email,
        title: "You are invited to join HireFlow",
        message: `You have been invited to join HireFlow. Please click the link to accept: ${inviteUrl}`,
        htmlContent: getInviteEmailTemplate(inviteUrl),
        type: NotificationType.INFO,
        metadata: { invitationId: savedInvitation.id },
        saveToDb: false,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    return savedInvitation;
  }

  async getPendingInvitations() {
    return this.invitationRepository.find({
      where: { accepted_at: IsNull() },
    });
  }
  async acceptInvitation(
    dto: AcceptInviteDto,
    response: Response,
  ): Promise<{ message: string; email: string; accessToken: string }> {
    const invitation = await this.getInvitationByToken(dto.token);

    const existingUser = await this.userService.findByEmail(invitation.email);
    if (existingUser) {
      throw new BadRequestException(
        "An account with this email already exists",
      );
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const newUser = this.userRepository.create({
      email: invitation.email,
      name: dto.name,
      password_hash: passwordHash,
      role: invitation.role,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(newUser);

    invitation.accepted_at = new Date();
    await this.invitationRepository.save(invitation);

    const accessToken = await this.signAccessToken(newUser);
    const refreshToken = await this.signRefreshToken(newUser);
    this.setRefreshCookie(response, refreshToken);

    return {
      message: "Account successfully created",
      email: newUser.email,
      accessToken,
    };
  }

  async getInvitationByToken(token: string): Promise<InvitationEntity> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new BadRequestException("Invalid invitation token");
    }

    if (invitation.accepted_at) {
      throw new BadRequestException(
        "This invitation has already been accepted",
      );
    }

    if (new Date() > invitation.expires_at) {
      throw new BadRequestException("This invitation has expired");
    }

    return invitation;
  }

  async resendInvitation(
    id: string,
    origin?: string,
  ): Promise<{ message: string }> {
    const invitation = await this.invitationRepository.findOne({
      where: { id },
      relations: ["invited_by"],
    });

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    if (invitation.accepted_at) {
      throw new BadRequestException(
        "This invitation has already been accepted",
      );
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    invitation.token = token;
    invitation.expires_at = expiresAt;
    await this.invitationRepository.save(invitation);

    const clientUrl =
      origin ||
      this.configService.get("CLIENT_URL") ||
      "http://204.13.235.172:1420";
    const inviteUrl = `${clientUrl}/accept-invite?token=${invitation.token}`;

    try {
      await this.notificationsService.send({
        userId: invitation.invited_by.id,
        recipientEmail: invitation.email,
        title: "You are invited to join HireFlow",
        message: `You have been invited to join HireFlow. Please click the link to accept: ${inviteUrl}`,
        htmlContent: getInviteEmailTemplate(inviteUrl),
        type: NotificationType.INFO,
        metadata: { invitationId: invitation.id },
      });
    } catch (error) {
      console.error("Failed to resend invitation email:", error);
    }

    return { message: "Invitation resent successfully" };
  }

  async deleteInvitation(email: string) {
    const invite = await this.invitationRepository.findOne({
      where: { email, accepted_at: IsNull() },
    });

    if (!invite) {
      throw new NotFoundException("Active invitation not found for this email");
    }

    await this.invitationRepository.remove(invite);
    return { message: `Invitation for ${email} has been revoked` };
  }

  async getMe(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }
}
