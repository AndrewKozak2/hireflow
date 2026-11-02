import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserEntity } from "src/user/entities/user.entity";
import { PasswordResetToken } from "./entities/forgot-password.entity";
import { UserModule } from "../user/user.module";
import { AuthGuard } from "./guards/auth.guard";
import { RefreshGuard } from "./guards/refresh.guard";
import { InvitationEntity } from "./entities/invitation.entity";
import { MailModule } from "../shared/services/mail.module";
import { RolesGuard } from "./guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
    }),
    TypeOrmModule.forFeature([
      InvitationEntity,
      UserEntity,
      PasswordResetToken,
    ]),
    MailModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController],
  exports: [PassportModule, JwtModule, RefreshGuard],
})
export class AuthModule {}
