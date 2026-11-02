import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { isUUID } from "class-validator";
import { HiringRequestEntity } from "../entities/hiring-request.entity";
import { UserRole } from "../../auth/enums/userRole.enum";
import { AuthenticatedRequest } from "../../auth/interfaces/authenticated-request.interface";

@Injectable()
export class HiringRequestOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(HiringRequestEntity)
    private readonly repo: Repository<HiringRequestEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const requestId = request.params.id as string;

    if (!requestId) {
      return true;
    }

    if (!isUUID(requestId)) {
      throw new BadRequestException("Validation failed (uuid is expected)");
    }

    const hiringRequest = await this.repo.findOne({ where: { id: requestId } });
    if (!hiringRequest) throw new NotFoundException("Request not found");

    const isOwner = hiringRequest.created_by_id === user.sub;
    const staffRoles = [UserRole.ADMIN, UserRole.RECRUITER];
    const isStaff = staffRoles.includes(user.role);

    if (isOwner || isStaff) {
      return true;
    }

    throw new ForbiddenException("You do not have access to this request");
  }
}
