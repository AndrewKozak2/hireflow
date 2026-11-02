import { apiClient } from "./AxiosService";

export const EmailSettingsService = {
  getEmailRules: () => {
    return apiClient.get("/email-settings/rules");
  },

  createEmailRule: (data) => {
    return apiClient.post("/email-settings/rules", data);
  },

  updateEmailRule: (id, data) => {
    return apiClient.patch(`/email-settings/rules/${id}`, data);
  },

  deleteEmailRule: (id) => {
    return apiClient.delete(`/email-settings/rules/${id}`);
  },

  getEmailProvider: () => {
    return apiClient.get("/email-settings/provider");
  },

  updateEmailProvider: (data) => {
    return apiClient.patch("/email-settings/provider", data);
  },
};
