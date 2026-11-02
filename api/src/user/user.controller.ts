import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { Controller, Patch, Body, Param, Get, Req } from "@nestjs/common";
import { AuthenticatedRequest } from "../auth/interfaces/authenticated-request.interface";
import { UserService } from "./user.service";
import { UserRole } from "../auth/enums/userRole.enum";
import { UserStatus } from "../auth/enums/userStatus.enum";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Users")
@ApiBearerAuth("access-token")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: "Get all users (Admin/Recruiter)" })
  @ApiResponse({
    status: 200,
    description: "List of all users retrieved successfully.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required.",
  })
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async getUsers() {
    return this.userService.findAll();
  }

  @Patch(":id/role")
  @ApiOperation({ summary: "Update user role" })
  @ApiParam({ name: "id", description: "The ID of the user to update." })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          enum: Object.values(UserRole),
          description: "The new role to assign to the user.",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "User role updated successfully." })
  @ApiResponse({ status: 400, description: "Invalid role provided." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required.",
  })
  @ApiResponse({ status: 404, description: "User not found." })
  @Roles(UserRole.ADMIN)
  async changeRole(@Param("id") id: string, @Body("role") role: UserRole) {
    return this.userService.updateRole(id, role);
  }

  @Patch(":id/deactivate")
  @ApiOperation({ summary: "Deactivate user account" })
  @ApiParam({ name: "id", description: "The ID of the user to deactivate." })
  @ApiResponse({
    status: 200,
    description: "User account deactivated successfully.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required.",
  })
  @ApiResponse({ status: 404, description: "User not found." })
  @Roles(UserRole.ADMIN)
  async deactivate(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.userService.setStatus(id, UserStatus.DEACTIVATED, req.user.sub);
  }

  @Patch(":id/reactivate")
  @ApiOperation({ summary: "Reactivate user account" })
  @ApiParam({ name: "id", description: "The ID of the user to reactivate." })
  @ApiResponse({
    status: 200,
    description: "User account reactivated successfully.",
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required.",
  })
  @ApiResponse({ status: 404, description: "User not found." })
  async reactivate(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.userService.setStatus(id, UserStatus.ACTIVE, req.user.sub);
  }
}
