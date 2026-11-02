import { apiClient } from "./AxiosService";

const HIRING_REQUESTS_API_URL = "/hiring-requests";

export const HiringRequestsService = {
  getHiringRequests: ({ statuses } = {}) => {
    const normalizedStatuses = Array.isArray(statuses)
      ? statuses.filter(Boolean)
      : statuses
        ? [statuses]
        : [];

    return apiClient.get(HIRING_REQUESTS_API_URL, {
      params:
        normalizedStatuses.length > 0
          ? { status: normalizedStatuses }
          : undefined,
    });
  },

  getHiringRequestById: (id) => {
    return apiClient.get(`${HIRING_REQUESTS_API_URL}/${id}`);
  },

  takeHiringRequestInReview: (id) => {
    return apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}/review`);
  },

  addHiringRequestInternalNote: (id, dto) => {
    return apiClient.patch(
      `${HIRING_REQUESTS_API_URL}/${id}/internal-notes`,
      dto,
    );
  },

  updateHiringRequestInternalNotes: (id, notesForRecruiter) => {
    return apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}`, {
      notes_for_recruiter: notesForRecruiter,
    });
  },

  getMyHiringRequests: () => apiClient.get(`${HIRING_REQUESTS_API_URL}/my`),

  createDraft: (data) =>
    apiClient.post(`${HIRING_REQUESTS_API_URL}/drafts`, data),

  updateDraft: (id, data) =>
    apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}/draft`, data),

  submitDraft: (id, data) =>
    apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}/submit`, data),

  deleteDraft: (id) => apiClient.delete(`${HIRING_REQUESTS_API_URL}/${id}`),

  createHiringRequest: (data) => apiClient.post(HIRING_REQUESTS_API_URL, data),

  updateHiringRequest: (id, data) =>
    apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}`, data),

  cancelHiringRequest: (id) =>
    apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}/cancel`),

  getJobPrefill: (hiringRequestId) => {
    return apiClient.get(
      `${HIRING_REQUESTS_API_URL}/${hiringRequestId}/job-prefill`,
    );
  },

  rejectHiringRequest: (id, reason) =>
    apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}/reject`, { reason }),

  resubmitHiringRequest: (id, data) =>
    apiClient.patch(`${HIRING_REQUESTS_API_URL}/${id}/resubmit`, data),
};

export { HIRING_REQUESTS_API_URL };
