import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JobService } from "./job.service";
import { GetJobsQueryDto } from "./dto/get-jobs-query.dto";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import { JobStatus } from "./enums/job-status.enum";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/enums/userRole.enum";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { Job } from "./entities/job.entity";

@ApiTags("Jobs")
@ApiBearerAuth("access-token")
@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "List all jobs" })
  @ApiOkResponse({
    description: "Returns a list of jobs.",
    type: [Job],
  })
  @ApiBadRequestResponse({ description: "Bad Request." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Job not found." })
  findAll(@Query() query: GetJobsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.jobService.findAll(query, user);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Get job status counts for the current user" })
  @ApiOkResponse({
    description: "Returns an object with counts for each job status.",
  })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.jobService.getJobStatusCounts(user);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Get job by ID" })
  @ApiParam({ name: "id", description: "The ID of the job" })
  @ApiOkResponse({
    description: "Returns the job details.",
    type: Job,
  })
  @ApiBadRequestResponse({ description: "Bad Request." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Job not found." })
  findOne(@Param("id") id: string) {
    return this.jobService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new job" })
  @ApiCreatedResponse({
    description: "Job created successfully.",
    type: Job,
  })
  @ApiBadRequestResponse({ description: "Bad Request." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Job not found." })
  create(@Body() createJobDto: CreateJobDto, @CurrentUser() user: JwtPayload) {
    return this.jobService.create(createJobDto, user);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a job" })
  @ApiParam({ name: "id", description: "The ID of the job to update" })
  @ApiOkResponse({
    description: "Job updated successfully.",
    type: Job,
  })
  @ApiBadRequestResponse({ description: "Bad Request." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Job not found." })
  update(@Param("id") id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobService.update(id, updateJobDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a job" })
  @ApiParam({ name: "id", description: "The ID of the job to delete" })
  @ApiNoContentResponse({ description: "Job deleted successfully." })
  @ApiBadRequestResponse({ description: "Bad Request." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Job not found." })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.jobService.remove(id);
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update job status" })
  @ApiParam({ name: "id", description: "The ID of the job" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: Object.values(JobStatus),
          example: JobStatus.ACTIVE,
        },
        notes: {
          type: "string",
          example: "Please review this urgent replacement.",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Job status updated successfully.",
    type: Job,
  })
  @ApiBadRequestResponse({ description: "Bad Request." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Job not found." })
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: JobStatus,
    @Body("notes") notes?: string,
  ) {
    return this.jobService.updateStatus(id, status, notes);
  }

  @Patch(":id/close")
  @ApiOperation({ summary: "Close a job" })
  @ApiParam({ name: "id", description: "The ID of the job to close" })
  @ApiOkResponse({
    description: "Job closed successfully.",
    type: Job,
  })
  @ApiBadRequestResponse({ description: "Bad Request." })
  @ApiUnauthorizedResponse({ description: "Unauthorized." })
  @ApiForbiddenResponse({ description: "Forbidden." })
  @ApiNotFoundResponse({ description: "Job not found." })
  @HttpCode(HttpStatus.OK)
  close(@Param("id") id: string) {
    return this.jobService.closeJob(id);
  }

  @Patch(":id/approve")
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Approve a pending job (Hiring Manager only)" })
  @ApiOkResponse({ description: "Job approved successfully." })
  @ApiBadRequestResponse({ description: "Invalid status transition." })
  @ApiForbiddenResponse({ description: "Not the assigned Hiring Manager." })
  @ApiNotFoundResponse({ description: "Job not found." })
  approve(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body("notes") notes?: string,
  ) {
    return this.jobService.approve(id, user, notes);
  }

  @Patch(":id/reject")
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: "Reject a pending job (Hiring Manager only)" })
  @ApiOkResponse({ description: "Job rejected successfully." })
  @ApiBadRequestResponse({ description: "Invalid status transition." })
  @ApiForbiddenResponse({ description: "Not the assigned Hiring Manager." })
  @ApiNotFoundResponse({ description: "Job not found." })
  reject(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body("notes") notes?: string,
  ) {
    return this.jobService.reject(id, user, notes);
  }
}
