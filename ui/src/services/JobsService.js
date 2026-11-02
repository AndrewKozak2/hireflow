import { apiClient } from "./AxiosService";

export const JobsService = {
  getAll: (params) => apiClient.get("/jobs", { params }),
  getById: (id) => apiClient.get(`/jobs/${id}`),
  getStatusCounts: () => apiClient.get("/jobs/stats"),
  create: (data) => apiClient.post("/jobs", data),
  update: (id, data) => apiClient.put(`/jobs/${id}`, data),
  delete: (id) => apiClient.delete(`/jobs/${id}`),
  updateStatus: (id, status) => apiClient.put(`/jobs/${id}/status`, { status }),
  closeJob: (id) => apiClient.patch(`/jobs/${id}/close`),
  approve: (id) => apiClient.patch(`/jobs/${id}/approve`),
  reject: (id) => apiClient.patch(`/jobs/${id}/reject`),
};
