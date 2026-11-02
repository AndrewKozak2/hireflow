import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseUUIDPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CandidateService, FileUpload } from "./candidate.service";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import { UpdateCandidateDto } from "./dto/update-candidate.dto";
import { UpdateSkillsDto } from "./dto/update-skills.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/enums/userRole.enum";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
import { CandidateQueryDto } from "./dto/candidate-query.dto";
import { Candidate } from "./entities/candidate.entity";
import { CandidateCv } from "./entities/candidate-cv.entity";

@ApiTags("Candidates")
@ApiBearerAuth("access-token")
@Controller("candidates")
@Roles(UserRole.ADMIN, UserRole.RECRUITER)
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get()
  @ApiExtraModels(Candidate)
  @ApiOperation({ summary: "Get all candidates with optional search" })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({
    name: "skills",
    required: false,
    type: String,
    description: "Comma separated skills",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of candidates",
    schema: {
      properties: {
        items: {
          type: "array",
          items: { $ref: getSchemaPath(Candidate) },
        },
        total: { type: "number" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Recruiter access required",
  })
  findAll(@Query() query: CandidateQueryDto) {
    return this.candidateService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get candidate by ID" })
  @ApiParam({ name: "id", description: "Candidate ID" })
  @ApiResponse({ status: 200, description: "Candidate found", type: Candidate })
  @ApiResponse({ status: 400, description: "Bad request - invalid ID" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Recruiter access required",
  })
  @ApiResponse({ status: 404, description: "Candidate not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.candidateService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create new candidate" })
  @ApiResponse({
    status: 201,
    description: "Candidate created",
    type: Candidate,
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Recruiter access required",
  })
  @ApiResponse({
    status: 409,
    description: "Candidate with this email already exists",
  })
  create(@Body() dto: CreateCandidateDto) {
    return this.candidateService.create(dto);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: "Update candidate data" })
  @ApiParam({ name: "id", description: "Candidate ID" })
  @ApiResponse({
    status: 200,
    description: "Candidate updated",
    type: Candidate,
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Recruiter access required",
  })
  @ApiResponse({ status: 404, description: "Candidate not found" })
  @ApiResponse({
    status: 409,
    description: "Conflict - Email already exists",
  })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidateService.update(id, dto);
  }

  @Patch(":id/skills")
  @ApiOperation({ summary: "Update candidate skills" })
  @ApiParam({ name: "id", description: "Candidate ID" })
  @ApiResponse({
    status: 200,
    description: "Candidate skills updated",
    type: Candidate,
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Recruiter access required",
  })
  @ApiResponse({ status: 404, description: "Candidate not found" })
  updateSkills(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillsDto,
  ) {
    return this.candidateService.updateSkills(id, dto.skills);
  }

  @Post(":id/cv")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload candidate CV" })
  @ApiParam({ name: "id", description: "Candidate ID" })
  @ApiResponse({
    status: 201,
    description: "CV uploaded successfully",
    type: [CandidateCv],
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid file or input data",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Recruiter access required",
  })
  @ApiResponse({ status: 404, description: "Candidate not found" })
  uploadCv(
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: "pdf" }),
        ],
      }),
    )
    file: FileUpload,
  ) {
    return this.candidateService.uploadCv(id, file);
  }

  @Get(":id/cv/:cvId/url")
  @ApiOperation({ summary: "Get temporary URL for candidate CV" })
  @ApiParam({ name: "id", description: "Candidate ID" })
  @ApiParam({ name: "cvId", description: "Candidate CV ID" })
  @ApiResponse({
    status: 200,
    description: "Temporary CV URL generated successfully",
    schema: {
      properties: {
        url: { type: "string", example: "https://example.com/cv.pdf" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid ID" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Recruiter access required",
  })
  @ApiResponse({ status: 404, description: "Candidate CV not found" })
  getCvUrl(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("cvId", ParseUUIDPipe) cvId: string,
  ) {
    return this.candidateService.getCvDownloadUrl(id, cvId);
  }
}
