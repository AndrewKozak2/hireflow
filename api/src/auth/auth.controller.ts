import {
  Controller,
  HttpStatus,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  Res,
  Param,
  Get,
  Delete,
  Headers,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./decorators/public.decorator";
import { RefreshGuard } from "./guards/refresh.guard";
import { AuthGuard } from "./guards/auth.guard";
import { Roles } from "./decorators/roles.decorator";
import { AuthenticatedRequest } from "./interfaces/authenticated-request.interface";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UserProfileResponseDto } from "./dto/user-profile-response.dto";
import { InviteDto } from "./dto/invite.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { UserRole } from "../auth/enums/userRole.enum";
import { InvitationEntity } from "./entities/invitation.entity";

const STRICT_AUTH_LIMIT = Number(process.env.AUTH_THROTTLE_LIMIT ?? 5);
const STRICT_AUTH_TTL = Number(process.env.AUTH_THROTTLE_TTL_MS ?? 60_000);
const STRICT_REFRESH_LIMIT = Number(process.env.REFRESH_THROTTLE_LIMIT ?? 10);
const STRICT_REFRESH_TTL = Number(
  process.env.REFRESH_THROTTLE_TTL_MS ?? 60_000,
);

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("invite")
  @ApiOperation({ summary: "Invite a new user to the platform" })
  @ApiBearerAuth("access-token")
  @Roles(UserRole.ADMIN)
  invite(
    @Body() inviteDto: InviteDto,
    @Req() req: AuthenticatedRequest,
    @Headers("origin") origin?: string,
  ): Promise<InvitationEntity> {
    return this.authService.createInvitation(inviteDto, req.user.sub, origin);
  }

  @Get("invitations")
  @Roles(UserRole.ADMIN)
  getInvitations() {
    return this.authService.getPendingInvitations();
  }

  @Post("invite/:id/resend")
  @ApiOperation({ summary: "Resend an invitation email" })
  @ApiBearerAuth("access-token")
  @Roles(UserRole.ADMIN)
  async resendInvitation(
    @Param("id") id: string,
    @Headers("origin") origin?: string,
  ): Promise<{ message: string }> {
    return this.authService.resendInvitation(id, origin);
  }

  @Delete("invite/:email")
  @ApiOperation({ summary: "Revoke an active invitation" })
  @ApiBearerAuth("access-token")
  @Roles(UserRole.ADMIN)
  async revokeInvite(@Param("email") email: string) {
    return this.authService.deleteInvitation(email);
  }

  @Post("accept-invite")
  @ApiOperation({ summary: "Accept invitation and create account" })
  @Public()
  @Throttle({
    default: {
      limit: STRICT_AUTH_LIMIT,
      ttl: STRICT_AUTH_TTL,
    },
  })
  acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; email: string; accessToken: string }> {
    return this.authService.acceptInvitation(dto, res);
  }

  @Get("invite/:token")
  @ApiOperation({ summary: "Check if invitation token is valid" })
  @Public()
  checkToken(@Param("token") token: string): Promise<InvitationEntity> {
    return this.authService.getInvitationByToken(token);
  }

  @Post("login")
  @ApiOperation({ summary: "Authenticate user and receive access token" })
  @Public()
  @Throttle({
    default: {
      limit: STRICT_AUTH_LIMIT,
      ttl: STRICT_AUTH_TTL,
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using refresh cookie" })
  @Public()
  @UseGuards(RefreshGuard)
  @HttpCode(200)
  @Throttle({
    default: {
      limit: STRICT_REFRESH_LIMIT,
      ttl: STRICT_REFRESH_TTL,
    },
  })
  refresh(@Req() req: AuthenticatedRequest) {
    return this.authService.refresh(req.user);
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout user and clear cookies" })
  @ApiBearerAuth("access-token")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
    return { success: true };
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset email" })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: STRICT_AUTH_LIMIT,
      ttl: STRICT_AUTH_TTL,
    },
  })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Headers("origin") origin?: string,
  ): Promise<void> {
    return this.authService.forgotPassword(dto, origin);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password using token" })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: STRICT_AUTH_LIMIT,
      ttl: STRICT_AUTH_TTL,
    },
  })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiBearerAuth("access-token")
  @Get("me")
  async getMe(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserProfileResponseDto> {
    return this.authService.getMe(req.user.sub);
  }
}
