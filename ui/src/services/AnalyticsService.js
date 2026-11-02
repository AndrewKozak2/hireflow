import api, { apiClient } from "./AxiosService";

export const AnalyticsService = {
  getDashboardStats: () => apiClient.get("/analytics/dashboard-stats"),
  getSources: (params) => apiClient.get("/analytics/sources", { params }),
  getMetrics: (params) => apiClient.get("/analytics/metrics", { params }),
  getFunnel: (params) => apiClient.get("/analytics/funnel", { params }),
  exportCsv: (params) =>
    api.get("/analytics/export", {
      params,
      responseType: "blob",
    }),
  getRecruitmentCosts: (params) =>
    apiClient.get("/analytics/recruitment-costs", { params }),
};
