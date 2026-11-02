import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserEntity } from "./entities/user.entity";
import { UserRole } from "../auth/enums/userRole.enum";
import { UserStatus } from "../auth/enums/userStatus.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async updateRole(id: string, newRole: UserRole): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException("User not found");

    user.role = newRole;
    return this.userRepository.save(user);
  }

  async setStatus(
    id: string,
    status: UserStatus,
    currentUserId: string,
  ): Promise<UserEntity> {
    if (id === currentUserId && status === UserStatus.DEACTIVATED) {
      throw new ForbiddenException("You cannot deactivate yourself");
    }

    const user = await this.findById(id);
    if (!user) throw new NotFoundException("User not found");

    user.status = status;
    return this.userRepository.save(user);
  }
}
