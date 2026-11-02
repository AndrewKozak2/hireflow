import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HiringRequestService } from "./hiring-request.service";
import { HiringRequestController } from "./hiring-request.controller";
import { HiringRequestEntity } from "./entities/hiring-request.entity";
import { UserEntity } from "../user/entities/user.entity";
import { HiringRequestOwnershipGuard } from "./guards/hiring-request-ownership.guard";
import { HiringRequestReviewEntity } from "./entities/hiring-request-review.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HiringRequestEntity,
      HiringRequestReviewEntity,
      UserEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [HiringRequestController],
  providers: [HiringRequestService, HiringRequestOwnershipGuard],
  exports: [HiringRequestService],
})
export class HiringRequestModule {}
