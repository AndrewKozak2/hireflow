export interface MetricsResult {
  current: {
    avgTimeToHire: number;
    offerAcceptanceRate: number;
    totalApplications: number;
    aiCoverage: number;
  };
  previous: {
    avgTimeToHire: number;
    offerAcceptanceRate: number;
    totalApplications: number;
    aiCoverage: number;
  };
  meta: {
    daysInRange: number;
    previousPeriodStart: string;
  };
}

export interface FunnelResult {
  stage: string;
  count: number;
  conversionRate: number;
  avgDays: number;
}

export interface SourceResult {
  source: string;
  total: number;
  hired: number;
  conversionRate: number;
}

export interface TimeInStageResult {
  stage: string;
  avgDays: number;
}

export interface RejectionReasonResult {
  reason: string;
  count: number;
}

export interface JobPerformanceResult {
  jobId: string;
  title: string;
  totalApps: number;
  inPipeline: number;
  hired: number;
  daysOpen: number;
  timeToHire: number;
}

export interface RecruitmentCostCategoryBreakdown {
  category: string;
  totalCost: number;
}

export interface RecruitmentCostJobBreakdown {
  jobId: string;
  title: string;
  totalCost: number;
}

export interface RecruitmentCostSourceBreakdown {
  source: string;
  totalCost: number;
}

export interface RecruitmentCostsAnalyticsResult {
  totalCost: number;
  hiredCount: number;
  averageCostToHire: number;
  currency: "USD";
  byCategory: RecruitmentCostCategoryBreakdown[];
  byJob: RecruitmentCostJobBreakdown[];
  bySource: RecruitmentCostSourceBreakdown[];
}

export interface RawMetricsRow {
  currentTotal: string | number | null;
  currentHired: string | number | null;
  currentOffer: string | number | null;
  currentAvgTime: string | number | null;
  currentAiApps: string | number | null;
  prevTotal: string | number | null;
  prevHired: string | number | null;
  prevOffer: string | number | null;
  prevAvgTime: string | number | null;
  prevAiApps: string | number | null;
}

export interface RawFunnelRow {
  stage: string;
  count: number;
  avgDays: number;
}

export interface RawSourceRow {
  source: string;
  total: string | number | null;
  hired: string | number | null;
}

export interface RawTimeInStageRow {
  stage: string;
  avgDays: string | number | null;
}

export interface RawRejectionRow {
  reason: string;
  count: string | number | null;
}

export interface RawJobPerformanceRow {
  jobId: string;
  title: string;
  totalApps: string | number | null;
  inPipeline: string | number | null;
  hired: string | number | null;
  daysOpen: string | number | null;
  timeToHire: string | number | null;
}

export interface RawDashboardStats {
  openPositionsCount?: number;
  openPositionsDiff?: number;
  newApplicationsCount?: number;
  newApplicationsDiff?: number;
  inPipelineCount?: number;
  pipelineConversionDiff?: number;
  pendingActionsCount?: number;
  pendingActionsDiff?: number;
}

export interface RawRecruitmentCostsAnalyticsRow {
  totalCost: string | number | null;
  hiredCount: string | number | null;
  byCategory: RecruitmentCostCategoryBreakdown[] | null;
  byJob: RecruitmentCostJobBreakdown[] | null;
  bySource: RecruitmentCostSourceBreakdown[] | null;
}
