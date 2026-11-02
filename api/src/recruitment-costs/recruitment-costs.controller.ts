import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from "@nestjs/common";
import { RecruitmentCostsService } from "./recruitment-costs.service";
import { CreateRecruitmentCostsDto } from "./dto/create-recruitment-costs.dto";
import { UpdateRecruitmentCostDto } from "./dto/update-recruitment-cost.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/enums/userRole.enum";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";

@ApiTags("Recruitment Costs")
@ApiBearerAuth("access-token")
@Controller()
export class RecruitmentCostsController {
  constructor(
    private readonly recruitmentCostsService: RecruitmentCostsService,
  ) {}

  @Get("jobs/:jobId/recruitment-costs")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Get recruitment costs and total for a job" })
  @ApiOkResponse({
    description:
      "Returns recruitment costs and total sum for the specified job",
  })
  @ApiBadRequestResponse({ description: "Invalid UUID format" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Insufficient permissions" })
  @ApiNotFoundResponse({ description: "Job not found" })
  findAllForJob(
    @Param("jobId", ParseUUIDPipe) jobId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitmentCostsService.findAllForJob(jobId, user);
  }

  @Post("jobs/:jobId/recruitment-costs")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Create one or multiple manual recruitment costs" })
  @ApiCreatedResponse({
    description: "Costs created successfully",
  })
  @ApiBadRequestResponse({
    description: "Invalid input or validation constraint failed",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Insufficient permissions" })
  @ApiNotFoundResponse({ description: "Job or Application not found" })
  create(
    @Param("jobId", ParseUUIDPipe) jobId: string,
    @Body() createDto: CreateRecruitmentCostsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitmentCostsService.create(jobId, createDto, user);
  }

  @Patch("recruitment-costs/:id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Update one manual recruitment cost" })
  @ApiOkResponse({
    description: "Recruitment cost updated successfully",
  })
  @ApiBadRequestResponse({
    description: "Invalid input or validation constraint failed",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Insufficient permissions" })
  @ApiNotFoundResponse({
    description: "Recruitment cost, Job, or Application not found",
  })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRecruitmentCostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitmentCostsService.update(id, updateDto, user);
  }

  @Delete("recruitment-costs/:id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Delete one manual recruitment cost" })
  @ApiOkResponse({
    description: "Recruitment cost deleted successfully",
  })
  @ApiBadRequestResponse({ description: "Automatic costs cannot be deleted" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Insufficient permissions" })
  @ApiNotFoundResponse({ description: "Recruitment cost not found" })
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.recruitmentCostsService.remove(id, user);
  }
}
