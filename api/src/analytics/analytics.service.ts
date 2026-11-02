import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import { AnalyticsRepository } from "./analytics.repository";
import {
  MetricsResult,
  FunnelResult,
  SourceResult,
  TimeInStageResult,
  RejectionReasonResult,
  JobPerformanceResult,
  RecruitmentCostsAnalyticsResult,
} from "./interfaces/analytics.interface";
import { UserRole } from "../auth/enums/userRole.enum";

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getMetrics(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<MetricsResult> {
    const diffTime = Math.abs(
      new Date(to).getTime() - new Date(from).getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const prevTo = new Date(new Date(from).getTime() - 1).toISOString();
    const prevFrom = new Date(
      new Date(from).getTime() - diffTime - 1,
    ).toISOString();

    const rawResult = await this.analyticsRepository.getRawMetrics(
      from,
      to,
      prevFrom,
      prevTo,
      user,
    );

    const row = rawResult[0];
    const safeDiv = (num: number, den: number) =>
      den === 0 ? 0 : (num / den) * 100;

    return {
      current: {
        avgTimeToHire: row?.currentAvgTime
          ? parseFloat(Number(row.currentAvgTime).toFixed(1))
          : 0,
        offerAcceptanceRate: parseFloat(
          safeDiv(
            Number(row?.currentHired ?? 0),
            Number(row?.currentOffer ?? 0),
          ).toFixed(1),
        ),
        totalApplications: Number(row?.currentTotal ?? 0),
        aiCoverage: parseFloat(
          safeDiv(
            Number(row?.currentAiApps ?? 0),
            Number(row?.currentTotal ?? 0),
          ).toFixed(1),
        ),
      },
      previous: {
        avgTimeToHire: row?.prevAvgTime
          ? parseFloat(Number(row.prevAvgTime).toFixed(1))
          : 0,
        offerAcceptanceRate: parseFloat(
          safeDiv(
            Number(row?.prevHired ?? 0),
            Number(row?.prevOffer ?? 0),
          ).toFixed(1),
        ),
        totalApplications: Number(row?.prevTotal ?? 0),
        aiCoverage: parseFloat(
          safeDiv(
            Number(row?.prevAiApps ?? 0),
            Number(row?.prevTotal ?? 0),
          ).toFixed(1),
        ),
      },
      meta: {
        daysInRange: diffDays,
        previousPeriodStart: prevFrom.split("T")[0],
      },
    };
  }

  async getFunnel(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<FunnelResult[]> {
    const rows = await this.analyticsRepository.getRawFunnel(from, to, user);

    const STAGE_MAPPING: Record<string, string> = {
      new: "New",
      screening: "Screening",
      pre_interview: "Pre-Interview",
      technical_interview: "Technical Interview",
      offer: "Offer",
      hired: "Hired",
    };
    const STAGE_ORDER = Object.keys(STAGE_MAPPING);

    const map = new Map<string, { count: number; avgDays: number }>(
      rows.map((r) => [
        String(r.stage).toLowerCase(),
        { count: Number(r.count), avgDays: Number(r.avgDays) },
      ]),
    );
    let prevCount = 0;

    return STAGE_ORDER.map((stageKey, index) => {
      const row = map.get(stageKey) || { count: 0, avgDays: 0 };
      let conversionRate = 0;
      if (index === 0) {
        conversionRate = 100;
      } else {
        conversionRate = prevCount === 0 ? 0 : (row.count / prevCount) * 100;
      }
      prevCount = row.count;
      return {
        stage: STAGE_MAPPING[stageKey],
        count: row.count,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        avgDays: parseFloat(row.avgDays.toFixed(1)),
      };
    });
  }

  async getSources(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<SourceResult[]> {
    const rows = await this.analyticsRepository.getRawSources(from, to, user);
    return rows.map((r) => ({
      source: r.source,
      total: Number(r.total ?? 0),
      hired: Number(r.hired ?? 0),
      conversionRate: Number(r.total ?? 0)
        ? parseFloat(
            ((Number(r.hired ?? 0) / Number(r.total ?? 0)) * 100).toFixed(1),
          )
        : 0,
    }));
  }

  async getTimeInStage(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<TimeInStageResult[]> {
    const rows = await this.analyticsRepository.getRawTimeInStage(
      from,
      to,
      user,
    );

    const STAGE_MAPPING: Record<string, string> = {
      new: "New",
      screening: "Screening",
      pre_interview: "Pre-Interview",
      technical_interview: "Technical Interview",
      offer: "Offer",
      hired: "Hired",
    };
    const STAGE_ORDER = Object.keys(STAGE_MAPPING);

    const map = new Map<string, { avgDays: string | number | null }>(
      rows.map((r) => [String(r.stage).toLowerCase(), r]),
    );

    return STAGE_ORDER.map((stageKey) => {
      const row = map.get(stageKey);
      return {
        stage: STAGE_MAPPING[stageKey],
        avgDays: row?.avgDays ? parseFloat(Number(row.avgDays).toFixed(1)) : 0,
      };
    });
  }

  async getRejectionReasons(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RejectionReasonResult[]> {
    const rows = await this.analyticsRepository.getRawRejectionReasons(
      from,
      to,
      user,
    );
    return rows.map((r) => ({
      reason: r.reason,
      count: Number(r.count ?? 0),
    }));
  }

  async getJobsPerformance(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<JobPerformanceResult[]> {
    const rows = await this.analyticsRepository.getRawJobsPerformance(
      from,
      to,
      user,
    );
    return rows.map((r) => ({
      jobId: r.jobId,
      title: r.title,
      totalApps: Number(r.totalApps ?? 0),
      inPipeline: Number(r.inPipeline ?? 0),
      hired: Number(r.hired ?? 0),
      daysOpen: Number(r.daysOpen ?? 0) || 0,
      timeToHire: Number(r.timeToHire ?? 0) || 0,
    }));
  }

  async getRecruitmentCostsAnalytics(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RecruitmentCostsAnalyticsResult> {
    const rows = await this.analyticsRepository.getRawRecruitmentCostsAnalytics(
      from,
      to,
      user,
    );
    const row = rows[0];
    const totalCost = Number(row?.totalCost ?? 0);
    const hiredCount = Number(row?.hiredCount ?? 0);
    const averageCostToHire =
      hiredCount === 0 ? 0 : Number((totalCost / hiredCount).toFixed(2));

    return {
      totalCost: Number(totalCost.toFixed(2)),
      hiredCount,
      averageCostToHire,
      currency: "USD",
      byCategory: (row?.byCategory ?? []).map((item) => ({
        category: item.category,
        totalCost: Number(Number(item.totalCost ?? 0).toFixed(2)),
      })),
      byJob: (row?.byJob ?? []).map((item) => ({
        jobId: item.jobId,
        title: item.title,
        totalCost: Number(Number(item.totalCost ?? 0).toFixed(2)),
      })),
      bySource: (row?.bySource ?? []).map((item) => ({
        source: item.source,
        totalCost: Number(Number(item.totalCost ?? 0).toFixed(2)),
      })),
    };
  }

  async getDashboardStats(user: JwtPayload) {
    const rawResult = await this.analyticsRepository.getRawDashboardStats(user);
    const row = rawResult[0];

    const formatTrend = (value: number, unit: string = "") => {
      if (value === 0) return "No change";
      const sign = value > 0 ? "↑" : "↓";
      return `${sign} ${Math.abs(value)}${unit}`;
    };

    const allStats = [
      {
        title: "OPEN POSITIONS",
        value: String(row?.openPositionsCount ?? 0),
        desc: `${formatTrend(row?.openPositionsDiff ?? 0)} since last month`,
        color: (row?.openPositionsDiff ?? 0) >= 0 ? "green" : "red",
      },
      {
        title: "NEW APPLICATIONS",
        value: String(row?.newApplicationsCount ?? 0),
        desc: `${formatTrend(row?.newApplicationsDiff ?? 0)} since yesterday`,
        color: (row?.newApplicationsDiff ?? 0) >= 0 ? "green" : "red",
      },
      {
        title: "IN PIPELINE",
        value: String(row?.inPipelineCount ?? 0),
        desc: `${(row?.pipelineConversionDiff ?? 0) >= 0 ? "↑" : "↓"} ${Math.abs(row?.pipelineConversionDiff ?? 0)}% conversion`,
        color: (row?.pipelineConversionDiff ?? 0) >= 0 ? "green" : "red",
      },
      {
        title: "PENDING ACTIONS",
        value: String(row?.pendingActionsCount ?? 0),
        desc: "No change awaiting",
        color: (row?.pendingActionsCount ?? 0) > 0 ? "red" : "green",
      },
    ];

    if (user.role === UserRole.HIRING_MANAGER) {
      return allStats.filter(
        (stat) =>
          stat.title === "OPEN POSITIONS" || stat.title === "PENDING ACTIONS",
      );
    }

    if (user.role === UserRole.ADMIN) {
      return allStats.filter(
        (stat) =>
          stat.title === "OPEN POSITIONS" ||
          stat.title === "NEW APPLICATIONS" ||
          stat.title === "IN PIPELINE",
      );
    }

    return allStats;
  }

  async exportCsv(
    from: string,
    to: string,
    user: JwtPayload,
    res: Response,
  ): Promise<void> {
    const filename = `hireflow-analytics-${from.split("T")[0]}.csv`;
    const displayFrom = from.split("T")[0];
    const displayTo = to.split("T")[0];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    const metrics = await this.getMetrics(from, to, user);
    const jobs = await this.getJobsPerformance(from, to, user);
    const sources = await this.getSources(from, to, user);

    const csvContent =
      `HIREFLOW RECRUITMENT ANALYTICS REPORT (${displayFrom} to ${displayTo})\n` +
      `Generated by: ${user.email} (Role: ${user.role})\n\n` +
      `SUMMARY METRICS\n` +
      `Metric,Current Period,Previous Period\n` +
      `Total Applications,${metrics.current.totalApplications},${metrics.previous.totalApplications}\n` +
      `Average Time To Hire,${metrics.current.avgTimeToHire} days,${metrics.previous.avgTimeToHire} days\n` +
      `Offer Acceptance Rate,${metrics.current.offerAcceptanceRate}%,${metrics.previous.offerAcceptanceRate}%\n` +
      `AI Coverage,${metrics.current.aiCoverage}%,${metrics.previous.aiCoverage}%\n\n` +
      `PER-JOB BREAKDOWN\n` +
      `Job Title,Total Applications,In Pipeline,Hired,Days Open,Time To Hire (Days)\n` +
      jobs
        .map(
          (j: JobPerformanceResult) =>
            `"${j.title}",${j.totalApps},${j.inPipeline},${j.hired},${j.daysOpen.toFixed(1)},${j.timeToHire.toFixed(1)}`,
        )
        .join("\n") +
      `\n\n` +
      `PER-SOURCE BREAKDOWN\n` +
      `Source,Total Applications,Hired Candidates,Conversion Rate (%)\n` +
      sources
        .map(
          (s: SourceResult) =>
            `"${s.source}",${s.total},${s.hired},${s.conversionRate.toFixed(1)}`,
        )
        .join("\n") +
      `\n`;

    res.status(200).send(csvContent);
  }
}
