import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiConsumes,
  ApiProduces,
} from "@nestjs/swagger";
import { EmailSettingService } from "./email-setting.service";
import { CreateEmailSourceRuleDto } from "./dto/create-email-source-rule.dto";
import { UpdateEmailSourceRuleDto } from "./dto/update-email-source-rule.dto";
import { EmailSourceRuleEntity } from "./entities/email-source-rule.entity";
import { UpdateEmailProviderDto } from "./dto/update-email-provider.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/enums/userRole.enum";

@ApiTags("Email Settings")
@ApiBearerAuth("access-token")
@ApiConsumes("application/json")
@ApiProduces("application/json")
@Roles(UserRole.ADMIN)
@Controller("email-settings")
export class EmailSettingController {
  constructor(private readonly emailSettingService: EmailSettingService) {}

  @Post("rules")
  @ApiOperation({ summary: "Create a new email source rule" })
  @ApiCreatedResponse({
    description: "The rule has been successfully created.",
    type: EmailSourceRuleEntity,
  })
  @ApiBadRequestResponse({ description: "Invalid input." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiConflictResponse({
    description: "Rule with this pattern already exists.",
  })
  create(
    @Body() createDto: CreateEmailSourceRuleDto,
  ): Promise<EmailSourceRuleEntity> {
    return this.emailSettingService.create(createDto);
  }

  @Get("rules")
  @ApiOperation({ summary: "Get all email source rules" })
  @ApiOkResponse({
    description: "Return all email source rules.",
    type: [EmailSourceRuleEntity],
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  findAll(): Promise<EmailSourceRuleEntity[]> {
    return this.emailSettingService.findAll();
  }

  @Patch("rules/:id")
  @ApiOperation({ summary: "Update an email source rule" })
  @ApiParam({
    name: "id",
    description: "The unique identifier of the email source rule",
    type: "string",
    format: "uuid",
  })
  @ApiOkResponse({
    description: "The rule has been successfully updated.",
    type: EmailSourceRuleEntity,
  })
  @ApiBadRequestResponse({ description: "Invalid input or ID format." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Rule not found." })
  @ApiConflictResponse({
    description: "Rule with this pattern already exists.",
  })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateEmailSourceRuleDto,
  ): Promise<EmailSourceRuleEntity> {
    return this.emailSettingService.update(id, updateDto);
  }

  @Get("provider")
  @ApiOperation({ summary: "Get the active email provider" })
  @ApiOkResponse({
    description: "Current email provider returned successfully.",
    schema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          example: "resend",
          description: "The active email provider name",
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  async getProvider(): Promise<{ provider: string }> {
    return { provider: await this.emailSettingService.getActiveProvider() };
  }

  @Patch("provider")
  @ApiOperation({ summary: "Update the active email provider" })
  @ApiOkResponse({
    description: "The active email provider has been updated.",
    schema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          example: "resend",
          description: "The new active email provider name",
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid input." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  async updateProvider(
    @Body() updateDto: UpdateEmailProviderDto,
  ): Promise<{ provider: string }> {
    return {
      provider: await this.emailSettingService.updateActiveProvider(
        updateDto.provider,
      ),
    };
  }

  @Delete("rules/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an email source rule" })
  @ApiParam({
    name: "id",
    description: "The unique identifier of the email source rule",
    type: "string",
    format: "uuid",
  })
  @ApiNoContentResponse({
    description: "The rule has been successfully deleted.",
  })
  @ApiBadRequestResponse({ description: "Invalid ID format." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Rule not found." })
  remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.emailSettingService.remove(id);
  }
}
