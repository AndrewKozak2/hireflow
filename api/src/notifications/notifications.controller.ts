import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { NotificationResponseDto } from "./dto/notification-response.dto";

@ApiTags("Notifications")
@ApiBearerAuth("access-token")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get active notifications for the current user" })
  @ApiOkResponse({
    description: "Active notifications returned successfully",
    type: [NotificationResponseDto],
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.findAll(user.sub);
  }

  @Patch("read-all")
  @ApiOperation({
    summary: "Mark all active notifications for the current user as read",
  })
  @ApiOkResponse({
    description: "Active notifications marked as read",
    schema: {
      type: "object",
      properties: {
        updated: { type: "number", example: 3 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiParam({ name: "id", type: "string", format: "uuid" })
  @ApiOkResponse({
    description: "Notification marked as read",
    type: NotificationResponseDto,
  })
  @ApiNotFoundResponse({
    description: "Notification not found or belongs to another user",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  markAsRead(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Delete("clear-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Clear all notifications for the current user" })
  @ApiNoContentResponse({
    description: "Notifications cleared successfully",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  async clearAll(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.notificationsService.clearAll(user.sub);
  }
}
