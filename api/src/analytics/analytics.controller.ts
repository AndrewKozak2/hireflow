import {
  Controller,
  Get,
  Query,
  Res,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Response } from "express";
import { AnalyticsService } from "./analytics.service";
import {
  MetricsResult,
  FunnelResult,
  SourceResult,
  TimeInStageResult,
  RejectionReasonResult,
  JobPerformanceResult,
  RecruitmentCostsAnalyticsResult,
} from "./interfaces/analytics.interface";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/enums/userRole.enum";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";

@ApiTags("Analytics")
@ApiBearerAuth("access-token")
@Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("metrics")
  @ApiOperation({
    summary: "Get core recruitment metrics with previous period trends",
  })
  @ApiResponse({ status: 200, description: "Metrics fetched successfully" })
  @ApiResponse({ status: 400, description: "Invalid date range structure" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getMetrics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MetricsResult> {
    this.validateDateRange(query.from, query.to);
    return this.analyticsService.getMetrics(query.from, query.to, user);
  }

  @Get("funnel")
  @ApiOperation({
    summary: "Get count, conversion rate and average days per stage",
  })
  @ApiResponse({
    status: 200,
    description: "Funnel details statistics fetched successfully",
  })
  getFunnel(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FunnelResult[]> {
    this.validateDateRange(query.from, query.to);
    return this.analyticsService.getFunnel(query.from, query.to, user);
  }

  @Get("sources")
  @ApiOperation({
    summary: "Get application metrics segmented by candidate sources",
  })
  @ApiResponse({
    status: 200,
    description: "Source tracking stats fetched successfully",
  })
  getSources(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SourceResult[]> {
    this.validateDateRange(query.from, query.to);
    return this.analyticsService.getSources(query.from, query.to, user);
  }

  @Get("time-in-stage")
  @ApiOperation({
    summary: "Get average days applications spend in each pipeline stage",
  })
  @ApiResponse({
    status: 200,
    description: "Time-in-stage analytics fetched successfully",
  })
  getTimeInStage(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeInStageResult[]> {
    this.validateDateRange(query.from, query.to);
    return this.analyticsService.getTimeInStage(query.from, query.to, user);
  }

  @Get("rejection-reasons")
  @ApiOperation({
    summary: "Get metrics on candidate rejection reason distribution",
  })
  @ApiResponse({
    status: 200,
    description: "Rejection reasons data fetched successfully",
  })
  getRejectionReasons(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RejectionReasonResult[]> {
    this.validateDateRange(query.from, query.to);
    return this.analyticsService.getRejectionReasons(
      query.from,
      query.to,
      user,
    );
  }

  @Get("jobs-performance")
  @ApiOperation({
    summary: "Get performance metrics breakdown per job vacancy",
  })
  @ApiResponse({
    status: 200,
    description: "Job metrics statistics fetched successfully",
  })
  getJobsPerformance(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<JobPerformanceResult[]> {
    this.validateDateRange(query.from, query.to);
    return this.analyticsService.getJobsPerformance(query.from, query.to, user);
  }

  @Get("recruitment-costs")
  @ApiOperation({
    summary: "Get recruitment cost analytics and average cost to hire",
  })
  @ApiResponse({
    status: 200,
    description: "Recruitment cost analytics fetched successfully",
  })
  getRecruitmentCostsAnalytics(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RecruitmentCostsAnalyticsResult> {
    this.validateDateRange(query.from, query.to);
    return this.analyticsService.getRecruitmentCostsAnalytics(
      query.from,
      query.to,
      user,
    );
  }

  @Get("dashboard-stats")
  @ApiOperation({
    summary: "Get 4 core metrics for top dashboard cards with trends",
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard stats fetched successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDashboardStats(user);
  }

  @Get("export")
  @ApiOperation({
    summary: "Export full summary, job, and source statistics as a CSV file",
  })
  @ApiResponse({ status: 200, description: "File attachment stream initiated" })
  @ApiResponse({
    status: 403,
    description: "Hiring Managers cannot perform CSV exports",
  })
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  exportCsv(
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    this.validateDateRange(query.from, query.to);
    if (user.role === UserRole.HIRING_MANAGER) {
      throw new ForbiddenException(
        "Hiring Managers are not authorized to export analytics data.",
      );
    }
    return this.analyticsService.exportCsv(query.from, query.to, user, res);
  }

  private validateDateRange(from: string, to: string): void {
    const startDate = new Date(from);
    const endDate = new Date(to);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      throw new BadRequestException(
        "Invalid date range: 'from' date must be earlier or equal to 'to' date.",
      );
    }
  }
}
