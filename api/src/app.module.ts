import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { RolesGuard } from "./auth/guards/roles.guard";
import { AuthGuard } from "./auth/guards/auth.guard"; // Assuming this is JwtAuthGuard
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { TypeORMConfig } from "./typeorm.config";
import { HiringRequestModule } from "./hiring-request/hiring-request.module";
import { JobModule } from "./job/job.module";
import { TerminusModule } from "@nestjs/terminus";
import { StorageModule } from "./storage/storage.module";
import { CandidateModule } from "./candidate/candidate.module";
import { buildThrottleSkipIf, getNumberConfig } from "./config/security.config";
import { ApplicationsModule } from "./applications/applications.module";
import { EmailSettingModule } from "./email-setting/email-setting.module";
import { EmailIngestModule } from "./email-ingest/email-ingest.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { LlmModule } from "./llm/llm.module";
import { RecruitmentCostsModule } from "./recruitment-costs/recruitment-costs.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        skipIf: buildThrottleSkipIf(config),
        throttlers: [
          {
            name: "default",
            ttl: getNumberConfig(config, "THROTTLE_TTL_MS", 60_000),
            limit: getNumberConfig(config, "THROTTLE_LIMIT", 100),
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => TypeORMConfig,
    }),
    UserModule,
    AuthModule,
    HiringRequestModule,
    JobModule,
    TerminusModule,
    StorageModule,
    CandidateModule,
    ApplicationsModule,
    EmailSettingModule,
    EmailIngestModule,
    AnalyticsModule,
    NotificationsModule,
    LlmModule,
    RecruitmentCostsModule,
  ],
  controllers: [], // HealthController removed as TerminusModule is not part of core domains
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Global JWT Auth Guard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Global Roles Guard
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
