import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { UserRole } from "../auth/enums/userRole.enum";
import { JwtPayload } from "../auth/interfaces/jwt-payload.interface";
import {
  RawMetricsRow,
  RawFunnelRow,
  RawSourceRow,
  RawTimeInStageRow,
  RawRejectionRow,
  RawJobPerformanceRow,
  RawDashboardStats,
  RawRecruitmentCostsAnalyticsRow,
} from "./interfaces/analytics.interface";

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private buildBaseWhere(
    user: JwtPayload,
    from: string,
    to: string,
    paramsOffset: number = 0,
  ) {
    let where = `a."createdAt" >= $${paramsOffset + 1} AND a."createdAt" <= $${paramsOffset + 2}`;
    const params: string[] = [from, to];
    let join = "";

    if (user.role === UserRole.HIRING_MANAGER) {
      join = `JOIN job_listings j_scope ON a."jobId" = j_scope.id`;
      where += ` AND j_scope.hiring_manager_id = $${paramsOffset + 3}`;
      params.push(user.sub);
    } else if (user.role === UserRole.RECRUITER) {
      join = `JOIN job_listings j_scope ON a."jobId" = j_scope.id`;
      where += ` AND (a."recruiterId" = $${paramsOffset + 3} OR j_scope.recruiter_id = $${paramsOffset + 3})`;
      params.push(user.sub);
    }
    return { where, join, params };
  }

  async getRawMetrics(
    from: string,
    to: string,
    prevFrom: string,
    prevTo: string,
    user: JwtPayload,
  ): Promise<RawMetricsRow[]> {
    const {
      where: whereCur,
      join: joinCur,
      params: paramsCur,
    } = this.buildBaseWhere(user, from, to, 0);
    const {
      where: wherePrev,
      join: joinPrev,
      params: paramsPrev,
    } = this.buildBaseWhere(user, prevFrom, prevTo, paramsCur.length);

    const query = `
      WITH current_apps AS (
        SELECT a.id, a.stage, a."createdAt"
        FROM applications a
        ${joinCur}
        WHERE ${whereCur}
      ),
      previous_apps AS (
        SELECT a.id, a.stage, a."createdAt"
        FROM applications a
        ${joinPrev}
        WHERE ${wherePrev}
      ),
      current_metrics AS (
        SELECT 
          COUNT(*) as total_apps,
          COUNT(CASE WHEN stage = 'hired' THEN 1 END) as hired_apps,
          COUNT(CASE WHEN stage IN ('offer', 'hired') THEN 1 END) as offer_apps,
          AVG(EXTRACT(EPOCH FROM (
            (SELECT e."createdAt" FROM application_event e WHERE e."applicationId" = current_apps.id AND e.type = 'stage_changed' AND e.payload->>'to' = 'hired' ORDER BY e."createdAt" DESC LIMIT 1) - current_apps."createdAt"
          ))/86400.0) as avg_time_to_hire,
          COUNT(CASE WHEN EXISTS(SELECT 1 FROM score_cards sc WHERE sc."applicationId" = current_apps.id) THEN 1 END) as ai_apps
        FROM current_apps
      ),
      previous_metrics AS (
        SELECT 
          COUNT(*) as total_apps,
          COUNT(CASE WHEN stage = 'hired' THEN 1 END) as hired_apps,
          COUNT(CASE WHEN stage IN ('offer', 'hired') THEN 1 END) as offer_apps,
          AVG(EXTRACT(EPOCH FROM (
            (SELECT e."createdAt" FROM application_event e WHERE e."applicationId" = previous_apps.id AND e.type = 'stage_changed' AND e.payload->>'to' = 'hired' ORDER BY e."createdAt" DESC LIMIT 1) - previous_apps."createdAt"
          ))/86400.0) as avg_time_to_hire,
          COUNT(CASE WHEN EXISTS(SELECT 1 FROM score_cards sc WHERE sc."applicationId" = previous_apps.id) THEN 1 END) as ai_apps
        FROM previous_apps
      )
      SELECT 
        c.total_apps as "currentTotal",
        c.hired_apps as "currentHired",
        c.offer_apps as "currentOffer",
        c.avg_time_to_hire as "currentAvgTime",
        c.ai_apps as "currentAiApps",
        p.total_apps as "prevTotal",
        p.hired_apps as "prevHired",
        p.offer_apps as "prevOffer",
        p.avg_time_to_hire as "prevAvgTime",
        p.ai_apps as "prevAiApps"
      FROM current_metrics c
      CROSS JOIN previous_metrics p
    `;

    return this.dataSource.query<RawMetricsRow[]>(query, [
      ...paramsCur,
      ...paramsPrev,
    ]);
  }

  async getRawFunnel(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RawFunnelRow[]> {
    const { where, join, params } = this.buildBaseWhere(user, from, to);
    const query = `
      WITH app_scope AS (
        SELECT a.id, a.stage, a."createdAt"
        FROM applications a
        ${join}
        WHERE ${where}
      ),
      stage_events AS (
        SELECT id as application_id, 'new' as stage, "createdAt" as entered_at
        FROM app_scope
        UNION ALL
        SELECT e."applicationId", e.payload->>'to' as stage, e."createdAt" as entered_at
        FROM application_event e
        JOIN app_scope a ON a.id = e."applicationId"
        WHERE e.type = 'stage_changed'
      ),
      stage_durations_base AS (
        SELECT 
          application_id, stage, entered_at,
          LEAD(entered_at) OVER (PARTITION BY application_id ORDER BY entered_at) as exited_at
        FROM stage_events
      ),
      stage_durations AS (
        SELECT stage, AVG(EXTRACT(EPOCH FROM (COALESCE(exited_at, CURRENT_TIMESTAMP) - entered_at))/86400.0) as avg_days
        FROM stage_durations_base
        GROUP BY stage
      ),
      reached_stages AS (
        SELECT application_id, stage FROM stage_events
      ),
      stage_counts AS (
        SELECT stage, COUNT(DISTINCT application_id) as count
        FROM reached_stages
        GROUP BY stage
      )
      SELECT sc.stage, sc.count::int, COALESCE(sd.avg_days, 0)::float as "avgDays"
      FROM stage_counts sc
      LEFT JOIN stage_durations sd ON sc.stage = sd.stage
    `;
    return this.dataSource.query<RawFunnelRow[]>(query, params);
  }

  async getRawSources(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RawSourceRow[]> {
    const { where, join, params } = this.buildBaseWhere(user, from, to);
    const query = `
      SELECT 
        a.source, 
        COUNT(*) as total, 
        COUNT(CASE WHEN a.stage = 'hired' THEN 1 END) as hired
      FROM applications a
      ${join}
      WHERE ${where} AND a.source IS NOT NULL
      GROUP BY a.source
    `;
    return this.dataSource.query<RawSourceRow[]>(query, params);
  }

  async getRawTimeInStage(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RawTimeInStageRow[]> {
    const { where, join, params } = this.buildBaseWhere(user, from, to);
    const query = `
      WITH app_scope AS (
        SELECT a.id, a.stage, a."createdAt"
        FROM applications a
        ${join}
        WHERE ${where}
      ),
      stage_events AS (
        SELECT id as application_id, 'new' as stage, "createdAt" as entered_at
        FROM app_scope
        UNION ALL
        SELECT e."applicationId", e.payload->>'to' as stage, e."createdAt" as entered_at
        FROM application_event e
        JOIN app_scope a ON a.id = e."applicationId"
        WHERE e.type = 'stage_changed'
      ),
      stage_durations_base AS (
        SELECT 
          application_id, 
          stage, 
          entered_at,
          LEAD(entered_at) OVER (PARTITION BY application_id ORDER BY entered_at) as exited_at
        FROM stage_events
      )
      SELECT 
        stage, 
        AVG(EXTRACT(EPOCH FROM (COALESCE(exited_at, CURRENT_TIMESTAMP) - entered_at))/86400.0) as "avgDays"
      FROM stage_durations_base
      GROUP BY stage
    `;
    return this.dataSource.query<RawTimeInStageRow[]>(query, params);
  }

  async getRawRejectionReasons(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RawRejectionRow[]> {
    const { where, join, params } = this.buildBaseWhere(user, from, to);
    const query = `
      SELECT 
        a."rejectionReason" as reason, 
        COUNT(*) as count
      FROM applications a
      ${join}
      WHERE ${where} AND a.stage = 'rejected' AND a."rejectionReason" IS NOT NULL
      GROUP BY a."rejectionReason"
    `;
    return this.dataSource.query<RawRejectionRow[]>(query, params);
  }

  async getRawJobsPerformance(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RawJobPerformanceRow[]> {
    let jobFilter = "";
    const params: string[] = [from, to];
    let paramsCount = 2;

    if (user.role === UserRole.HIRING_MANAGER) {
      paramsCount++;
      jobFilter = `WHERE j.hiring_manager_id = $${paramsCount}`;
      params.push(user.sub);
    } else if (user.role === UserRole.RECRUITER) {
      paramsCount++;
      jobFilter = `WHERE j.recruiter_id = $${paramsCount} OR j.id IN (SELECT DISTINCT "jobId" FROM applications WHERE "recruiterId" = $${paramsCount})`;
      params.push(user.sub);
    }

    const query = `
      WITH app_scope AS (
        SELECT a.id, a.stage, a."createdAt", a."jobId"
        FROM applications a
        WHERE a."createdAt" >= $1 AND a."createdAt" <= $2
        ${
          user.role === UserRole.RECRUITER
            ? `AND (a."recruiterId" = $${paramsCount} OR a."jobId" IN (SELECT id FROM job_listings WHERE recruiter_id = $${paramsCount}))`
            : ""
        }
      )
      SELECT 
        j.id as "jobId",
        j.title,
        COUNT(a.id) as "totalApps",
        COUNT(CASE WHEN a.stage NOT IN ('hired', 'rejected') THEN 1 END) as "inPipeline",
        COUNT(CASE WHEN a.stage = 'hired' THEN 1 END) as "hired",
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - j.created_at))/86400.0 as "daysOpen",
        AVG(EXTRACT(EPOCH FROM (
          (SELECT e."createdAt" FROM application_event e WHERE e."applicationId" = a.id AND e.type = 'stage_changed' AND e.payload->>'to' = 'hired' ORDER BY e."createdAt" DESC LIMIT 1) - a."createdAt"
        ))/86400.0) as "timeToHire"
      FROM job_listings j
      LEFT JOIN app_scope a ON a."jobId" = j.id
      ${jobFilter}
      GROUP BY j.id, j.title, j.created_at
    `;
    return this.dataSource.query<RawJobPerformanceRow[]>(query, params);
  }

  async getRawDashboardStats(user: JwtPayload): Promise<RawDashboardStats[]> {
    const params: any[] = [];
    let jobWhere = "";
    let appWhere = "";
    let hrWhere = "";

    if (user.role === UserRole.HIRING_MANAGER) {
      params.push(user.sub);
      const paramIndex = params.length;
      jobWhere = `AND j.hiring_manager_id = $${paramIndex}`;
      appWhere = `AND a."jobId" IN (SELECT id FROM job_listings WHERE hiring_manager_id = $${paramIndex})`;
      hrWhere = `AND hr.created_by_id = $${paramIndex}`;
    }

    const query = `
      WITH open_positions AS (
        SELECT COUNT(*)::int as count
        FROM job_listings j
        WHERE j.status = 'active' ${jobWhere}
      ),
      open_positions_prev AS (
        SELECT COUNT(*)::int as count
        FROM job_listings j
        WHERE j.status = 'active' AND j.created_at < CURRENT_DATE - INTERVAL '1 month' ${jobWhere}
      ),
      new_applications AS (
        SELECT COUNT(*)::int as count
        FROM applications a
        WHERE a.stage = 'new' ${appWhere}
      ),
      new_applications_prev AS (
        SELECT COUNT(*)::int as count
        FROM applications a
        WHERE a.stage = 'new' AND a."createdAt" < CURRENT_DATE - INTERVAL '1 day' ${appWhere}
      ),
      in_pipeline AS (
        SELECT COUNT(*)::int as count
        FROM applications a
        WHERE a.stage NOT IN ('new', 'hired', 'rejected')
          AND a."jobId" IN (SELECT id FROM job_listings j WHERE j.status = 'active' ${jobWhere})
      ),
      pipeline_prev AS (
        SELECT COUNT(*)::int as total, COUNT(CASE WHEN stage = 'hired' THEN 1 END)::int as hired
        FROM applications a
        WHERE a."createdAt" < CURRENT_DATE - INTERVAL '1 month'
          ${appWhere}
      ),
      recruiter_pending_actions AS (
        SELECT
          (SELECT COUNT(*)::int FROM job_listings j WHERE j.status = 'draft') +
          (SELECT COUNT(*)::int FROM hiring_requests hr WHERE hr.status IN ('in_review', 'pending')) +
          (SELECT COUNT(*)::int FROM applications a WHERE a.stage = 'new')
          as count
      ),
      hm_pending_actions AS (
        SELECT
          (SELECT COUNT(*)::int FROM hiring_requests hr WHERE hr.status = 'draft' ${hrWhere}) +
          (SELECT COUNT(*)::int FROM job_listings j WHERE j.status = 'pending_approval' ${jobWhere})
          as count
      ),
      admin_pending_actions AS (
        SELECT
          (SELECT count FROM recruiter_pending_actions) +
          (SELECT count FROM hm_pending_actions)
          as count
      )
      SELECT
        (SELECT count FROM open_positions) as "openPositionsCount",
        (SELECT count FROM open_positions) - (SELECT count FROM open_positions_prev) as "openPositionsDiff",
        (SELECT count FROM new_applications) as "newApplicationsCount",
        (SELECT count FROM new_applications) - (SELECT count FROM new_applications_prev) as "newApplicationsDiff",
        (SELECT count FROM in_pipeline) as "inPipelineCount",
        (
          SELECT
            CASE
              WHEN pp.total = 0 THEN 0
              ELSE ROUND((pp.hired::decimal / pp.total) * 100)
            END
          FROM pipeline_prev pp
        ) as "pipelineConversionDiff",
        (
          CASE
            WHEN '${user.role}' = '${UserRole.ADMIN}' THEN (SELECT count FROM admin_pending_actions)
            WHEN '${user.role}' = '${UserRole.RECRUITER}' THEN (SELECT count FROM recruiter_pending_actions)
            WHEN '${user.role}' = '${UserRole.HIRING_MANAGER}' THEN (SELECT count FROM hm_pending_actions)
            ELSE 0
          END
        )::int as "pendingActionsCount",
        0 as "pendingActionsDiff"
    `;

    return this.dataSource.query<RawDashboardStats[]>(query, params);
  }

  async getRawRecruitmentCostsAnalytics(
    from: string,
    to: string,
    user: JwtPayload,
  ): Promise<RawRecruitmentCostsAnalyticsRow[]> {
    const params: string[] = [from, to];
    let jobAccessWhere = "";

    if (user.role === UserRole.HIRING_MANAGER) {
      params.push(user.sub);
      jobAccessWhere = `WHERE j.hiring_manager_id = $3`;
    } else if (user.role === UserRole.RECRUITER) {
      params.push(user.sub);
      jobAccessWhere = `
        WHERE j.recruiter_id = $3
          OR EXISTS (
            SELECT 1
            FROM applications a_scope
            WHERE a_scope."jobId" = j.id
              AND a_scope."recruiterId" = $3
          )
      `;
    }

    const query = `
      WITH accessible_jobs AS (
        SELECT j.id, j.title
        FROM job_listings j
        ${jobAccessWhere}
      ),
      costs_in_period AS (
        SELECT
          rc.id,
          rc.job_id,
          rc.category::text AS category,
          COALESCE(NULLIF(rc.source, ''), 'Other') AS source,
          rc.amount::numeric AS amount,
          aj.title AS job_title
        FROM recruitment_costs rc
        JOIN accessible_jobs aj ON aj.id = rc.job_id
        WHERE rc.incurred_at >= $1
          AND rc.incurred_at <= $2
      ),
      hired_events AS (
        SELECT DISTINCT e."applicationId"
        FROM application_event e
        JOIN applications a ON a.id = e."applicationId"
        JOIN accessible_jobs aj ON aj.id = a."jobId"
        WHERE e.type = 'stage_changed'
          AND e.payload->>'to' = 'hired'
          AND e."createdAt" >= $1
          AND e."createdAt" <= $2
      ),
      category_breakdown AS (
        SELECT
          category,
          SUM(amount)::float AS total_cost
        FROM costs_in_period
        GROUP BY category
      ),
      job_breakdown AS (
        SELECT
          job_id,
          job_title,
          SUM(amount)::float AS total_cost
        FROM costs_in_period
        GROUP BY job_id, job_title
      ),
      source_breakdown AS (
        SELECT
          source,
          SUM(amount)::float AS total_cost
        FROM costs_in_period
        GROUP BY source
      )
      SELECT
        COALESCE((SELECT SUM(amount)::float FROM costs_in_period), 0) AS "totalCost",
        COALESCE((SELECT COUNT(*)::int FROM hired_events), 0) AS "hiredCount",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'category', category,
                'totalCost', total_cost
              )
              ORDER BY total_cost DESC, category ASC
            )
            FROM category_breakdown
          ),
          '[]'::json
        ) AS "byCategory",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'jobId', job_id,
                'title', job_title,
                'totalCost', total_cost
              )
              ORDER BY total_cost DESC, job_title ASC
            )
            FROM job_breakdown
          ),
          '[]'::json
        ) AS "byJob",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'source', source,
                'totalCost', total_cost
              )
              ORDER BY total_cost DESC, source ASC
            )
            FROM source_breakdown
          ),
          '[]'::json
        ) AS "bySource"
    `;

    return this.dataSource.query<RawRecruitmentCostsAnalyticsRow[]>(
      query,
      params,
    );
  }
}
