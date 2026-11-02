import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiParam,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from "@nestjs/swagger";
import { HiringRequestService } from "./hiring-request.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { CreateHiringRequestDto } from "./dto/create-hiring-request.dto";
import { UpdateHiringRequestDto } from "./dto/update-hiring-request.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/enums/userRole.enum";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { HiringRequestOwnershipGuard } from "./guards/hiring-request-ownership.guard";
import { HiringRequestStatus } from "./enums/hiring-status.enum";
import { JobPrefillResponseDto } from "./dto/job-prefill.dto";
import { HiringRequestEntity } from "./entities/hiring-request.entity";
import { RejectHiringRequestDto } from "./dto/reject-hiring-request.dto";
import { AddInternalNoteDto } from "./dto/add-internal-note.dto";
import { CreateDraftHiringRequestDto } from "./dto/create-draft-hiring-request.dto";

@ApiTags("Hiring Requests")
@ApiBearerAuth("access-token")
@Controller("hiring-requests")
@UseGuards(AuthGuard, RolesGuard, HiringRequestOwnershipGuard)
@Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN)
export class HiringRequestController {
  constructor(private readonly hiringRequestService: HiringRequestService) {}

  @Post("drafts")
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: "Save a hiring request as draft (all fields optional)",
  })
  @ApiCreatedResponse({
    description: "Draft created.",
    type: HiringRequestEntity,
  })
  async createDraft(
    @Body() dto: CreateDraftHiringRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.createDraft(dto, user);
  }

  @Patch(":id/draft")
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Autosave fields to an existing draft" })
  @ApiParam({ name: "id", description: "Draft hiring request UUID" })
  @ApiOkResponse({ description: "Draft updated.", type: HiringRequestEntity })
  async updateDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateDraftHiringRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.updateDraft(id, dto, user);
  }

  @Patch(":id/submit")
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: "Submit a draft as a formal hiring request (full validation)",
  })
  @ApiParam({ name: "id", description: "Draft hiring request UUID" })
  @ApiOkResponse({
    description: "Request submitted.",
    type: HiringRequestEntity,
  })
  async submitDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateHiringRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.submitDraft(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a draft hiring request" })
  @ApiParam({ name: "id", description: "Draft hiring request UUID" })
  async deleteDraft(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.deleteDraft(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: "Create a new hiring request" })
  @ApiCreatedResponse({
    description: "The hiring request has been successfully created.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({ description: "Invalid input." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  async create(
    @Body() dto: CreateHiringRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Get all hiring requests (Admin/Recruiter only)" })
  @ApiOkResponse({
    description: "Return all hiring requests.",
    type: [HiringRequestEntity],
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: HiringRequestStatus,
    isArray: true,
    description: "Filter by status",
  })
  @ApiBadRequestResponse({ description: "Invalid query parameters." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  findAll(
    @Query("status") status?: HiringRequestStatus | HiringRequestStatus[],
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.hiringRequestService.findAll(status, user?.role);
  }

  @Get("my")
  @ApiOperation({ summary: "Get hiring requests created by the current user" })
  @ApiOkResponse({
    description: "Returns the user's hiring requests.",
    type: [HiringRequestEntity],
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  async findMyRequests(@CurrentUser() user: JwtPayload) {
    return this.hiringRequestService.findMyRequests(user.sub);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Get a hiring request by ID" })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiOkResponse({
    description: "Return the hiring request.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({ description: "Invalid ID format." })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.findOne(id, user.role);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Update a hiring request or recruiter notes" })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiOkResponse({
    description: "The hiring request has been successfully updated.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({ description: "Invalid input or ID format." })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateHiringRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.update(id, dto, user);
  }

  @Patch(":id/internal-notes")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Add an internal note with author" })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiBody({ type: AddInternalNoteDto })
  @ApiOkResponse({
    description: "The internal note has been successfully added.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({ description: "Invalid input or ID format." })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  async addInternalNote(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddInternalNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.addInternalNote(id, dto, user);
  }

  @Patch(":id/review")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({
    summary: "Take a hiring request into review (Admin/Recruiter only)",
  })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiOkResponse({
    description: "The hiring request status has been updated to IN_REVIEW.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({
    description: "Only pending requests can be taken into review.",
  })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  review(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.takeInReview(id, user);
  }

  @Patch(":id/reject")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({
    summary: "Reject a hiring request (Admin/Recruiter only)",
  })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiBody({ type: RejectHiringRequestDto })
  @ApiOkResponse({
    description: "The hiring request has been rejected.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({
    description: "Only pending or in-review requests can be rejected.",
  })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  reject(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RejectHiringRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.reject(id, dto, user);
  }

  @Patch(":id/resubmit")
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: "Resubmit a rejected hiring request (Hiring Manager only)",
  })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiBody({ type: UpdateHiringRequestDto })
  @ApiOkResponse({
    description: "The hiring request has been resubmitted.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({
    description: "Only rejected requests can be resubmitted.",
  })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  resubmit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateHiringRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.resubmit(id, dto, user);
  }

  @Patch(":id/cancel")
  @ApiOperation({ summary: "Cancel a hiring request" })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiOkResponse({
    description: "The hiring request has been cancelled.",
    type: HiringRequestEntity,
  })
  @ApiBadRequestResponse({
    description: "Only pending requests can be cancelled.",
  })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.hiringRequestService.cancel(id, user.sub);
  }

  @Get(":id/job-prefill")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({
    summary:
      "Get prefilled data for creating a job from a hiring request (Admin/Recruiter only)",
  })
  @ApiParam({ name: "id", description: "Hiring request UUID" })
  @ApiOkResponse({
    description: "Return prefilled job data.",
    type: JobPrefillResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Job prefill is only available for hiring requests with status 'in_review'.",
  })
  @ApiNotFoundResponse({ description: "Hiring request not found." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Permission denied." })
  async getJobPrefill(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<JobPrefillResponseDto> {
    return this.hiringRequestService.getJobPrefill(id);
  }
}
