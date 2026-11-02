import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { REFRESH_COOKIE_NAME } from "../constants/auth.constants";
import { Request } from "express";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.cookies?.[REFRESH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException("Refresh token missing");
    }

    const secret = this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    if (!secret) {
      throw new UnauthorizedException("Auth configuration error");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
