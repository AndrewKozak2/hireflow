import { apiClient } from "./AxiosService";

const BASE_URL = "/applications";

export const ApplicationsService = {
  /**
   * @param {Object} params
   */
  getApplications: (params) => apiClient.get(BASE_URL, { params }),

  getCounts: (params) => apiClient.get(`${BASE_URL}/count`, { params }),

  getApplication: (id) => apiClient.get(`${BASE_URL}/${id}`),

  createApplication: (data) => apiClient.post(BASE_URL, data),

  updateApplication: (id, data) => apiClient.patch(`${BASE_URL}/${id}`, data),

  changeStage: (
    id,
    stage,
    rejectionReason = null,
    rejectionComment = null,
    emailMessage = null,
    sendEmail = false,
    emailSubject = null,
  ) =>
    apiClient.patch(`${BASE_URL}/${id}/stage`, {
      stage,
      rejectionReason,
      rejectionComment,
      ...(stage === "rejected"
        ? { emailMessage, sendEmail, ...(emailSubject ? { emailSubject } : {}) }
        : {}),
    }),

  addComment: (id, content) =>
    apiClient.post(`${BASE_URL}/${id}/comments`, { content }),

  uploadCv: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post(`/applications/${id}/cv`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  runScreeningFromExistingCv: (id) =>
    apiClient.post(`${BASE_URL}/${id}/run-screening`),

  sendEmail: (id, data) => apiClient.post(`${BASE_URL}/${id}/send-email`, data),

  generateRejectionLetterDraft: (id, data) =>
    apiClient.post(`${BASE_URL}/${id}/rejection-letter-draft`, data),

  acceptOffer: (id) => apiClient.patch(`${BASE_URL}/${id}/accept-offer`),
  declineOffer: (id, data) =>
    apiClient.patch(`${BASE_URL}/${id}/decline-offer`, data),
  hireApplication: (id, data) =>
    apiClient.patch(`${BASE_URL}/${id}/hire`, data),
  generateAiScoreCard: (id) =>
    apiClient.post(`${BASE_URL}/${id}/score-card/ai-generate`),
};
