import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { ApplicationsService } from "./applications.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { ApplicationQueryDto } from "./dto/application-query.dto";
import { ChangeStageDto } from "./dto/change-stage.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { DeclineOfferDto } from "./dto/decline-offer.dto";
import { SendEmailDto } from "./dto/send-email.dto";
import { GenerateRejectionLetterDto } from "./dto/generate-rejection-letter.dto";
import { HireApplicationDto } from "./dto/hire-application.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/enums/userRole.enum";
import { UpdateApplicationDto } from "./dto/update-application.dto";
import { MulterFile } from "src/storage/storage.service";
import { Application } from "./entities/application.entity";
import { ApplicationComment } from "./entities/application-comment.entity";

@ApiTags("Applications")
@ApiBearerAuth("access-token")
@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Create a new application" })
  @ApiBody({ type: CreateApplicationDto })
  @ApiCreatedResponse({
    description: "Application created successfully",
    type: Application,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  create(@Body() dto: CreateApplicationDto, @CurrentUser() user: JwtPayload) {
    return this.applicationsService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Get list of applications with optional filters" })
  @ApiQuery({ type: ApplicationQueryDto })
  @ApiExtraModels(Application)
  @ApiOkResponse({
    description: "List of applications",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { $ref: getSchemaPath(Application) },
        },
        meta: {
          type: "object",
          properties: {
            total: { type: "number", example: 100 },
            page: { type: "number", example: 1 },
            limit: { type: "number", example: 25 },
            totalPages: { type: "number", example: 4 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  findAll(
    @Query() query: ApplicationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.findAll(query, user);
  }

  @Get("count")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: "Get applications counts grouped by stages and sources",
  })
  @ApiQuery({ type: ApplicationQueryDto })
  @ApiOkResponse({
    description: "Object containing application counts",
    schema: {
      type: "object",
      properties: {
        all: { type: "number", example: 10 },
        new: { type: "number", example: 4 },
        unmatched: { type: "number", example: 1 },
        djinni: { type: "number", example: 3 },
        dou: { type: "number", example: 2 },
        linkedin: { type: "number", example: 3 },
        manual: { type: "number", example: 1 },
        referral: { type: "number", example: 1 },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  getCounts(
    @Query() query: ApplicationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.getCounts(query, user);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Get application by ID" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiOkResponse({
    description: "Application details",
    type: Application,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Update application" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiBody({ type: UpdateApplicationDto })
  @ApiOkResponse({
    description: "Application updated successfully",
    type: Application,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, dto);
  }

  @Patch(":id/stage")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Change application stage" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiBody({ type: ChangeStageDto })
  @ApiOkResponse({
    description: "Application stage updated successfully",
    type: Application,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  changeStage(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.changeStage(id, dto, user.sub);
  }

  @Patch(":id/accept-offer")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Accept offer for application" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiOkResponse({
    description: "Offer accepted successfully",
    schema: {
      type: "object",
      properties: {
        remainingPipelineCount: { type: "number", example: 5 },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  @ApiResponse({
    status: 422,
    description: "Unprocessable Entity: Application not in offer stage",
  })
  acceptOffer(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.acceptOffer(id, user.sub);
  }

  @Patch(":id/decline-offer")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Decline offer for application" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiBody({ type: DeclineOfferDto })
  @ApiOkResponse({
    description: "Offer declined successfully",
    type: Application,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  @ApiResponse({
    status: 422,
    description: "Unprocessable Entity: Application not in offer stage",
  })
  declineOffer(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: DeclineOfferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.declineOffer(id, dto, user.sub);
  }

  @Patch(":id/hire")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({
    summary:
      "Hire a candidate — transitions Offer → Hired and creates automatic recruitment costs",
  })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiBody({ type: HireApplicationDto })
  @ApiOkResponse({
    description: "Candidate hired successfully",
    type: Application,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  @ApiResponse({
    status: 422,
    description: "Unprocessable Entity: Application not in OFFER stage",
  })
  hire(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: HireApplicationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.hire(id, dto, user);
  }

  @Post(":id/send-email")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Send a custom email to a candidate" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiBody({ type: SendEmailDto })
  @ApiCreatedResponse({ description: "Email sent successfully" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  sendEmail(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SendEmailDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.sendEmail(id, dto, user.sub);
  }

  @Post(":id/rejection-letter-draft")
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: "Generate a rejection letter draft for an application",
  })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiBody({ type: GenerateRejectionLetterDto })
  @ApiOkResponse({
    description: "Rejection letter draft generated successfully",
    schema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
        tone: { type: "string", enum: ["neutral", "warm", "concise"] },
        usedContext: { type: "array", items: { type: "string" } },
        guardrailNotes: { type: "array", items: { type: "string" } },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  generateRejectionLetterDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: GenerateRejectionLetterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.generateRejectionLetterDraft(id, dto, user);
  }

  @Post(":id/comments")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Add comment to application" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiBody({ type: CreateCommentDto })
  @ApiCreatedResponse({
    description: "Comment added successfully",
    type: ApplicationComment,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  addComment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.addComment(id, dto, user.sub);
  }

  @Post(":id/cv")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Upload CV for application" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiCreatedResponse({ description: "CV uploaded successfully" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  uploadCv(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.uploadCv(id, file, user.sub);
  }

  @Post(":id/run-screening")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Run AI screening using existing candidate CV" })
  @ApiResponse({ status: 404, description: "Not Found" })
  @ApiResponse({
    status: 422,
    description:
      "Unprocessable Entity: candidate has CVs, but none is a readable PDF, DOCX or TXT",
  })
  runScreeningFromExistingCv(@Param("id", ParseUUIDPipe) id: string) {
    return this.applicationsService.runScreeningFromExistingCv(id);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Delete application" })
  @ApiParam({ name: "id", type: String, description: "Application ID (UUID)" })
  @ApiOkResponse({
    description: "Application deleted successfully",
    type: Application,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Not Found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.applicationsService.remove(id);
  }
  @Post(":id/score-card/ai-generate")
  @ApiOperation({
    summary: "Generate AI Score Card based on interview comments",
  })
  async generateAiScoreCard(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.generateAiScoreCard(id, user.sub);
  }
}
