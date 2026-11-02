import { apiClient } from "./AxiosService";

export const RecruitmentCostsService = {
  getForJob: (jobId) => apiClient.get(`/jobs/${jobId}/recruitment-costs`),
  create: (jobId, costs) =>
    apiClient.post(`/jobs/${jobId}/recruitment-costs`, { costs }),
  update: (id, data) => apiClient.patch(`/recruitment-costs/${id}`, data),
  remove: (id) => apiClient.delete(`/recruitment-costs/${id}`),
};
