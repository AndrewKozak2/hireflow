import { apiClient } from "./AxiosService";

export const AuthService = {
  login: (email, password) => {
    return apiClient.post("/auth/login", { email, password });
  },

  fetchUser: () => {
    return apiClient.get("/auth/me");
  },

  logout: async () => {
    return apiClient.post("/auth/logout");
  },

  inviteUser: async (data) => {
    return apiClient.post("/auth/invite", data);
  },

  acceptInvite: async (data) => {
    return apiClient.post("/auth/accept-invite", data);
  },

  checkInviteToken: (token) => {
    return apiClient.get(`/auth/invite/${token}`);
  },

  revokeInvite: async (email) => {
    return apiClient.delete(`/auth/invite/${email}`);
  },

  forgotPassword: async (email) => {
    const res = await apiClient.post("/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (token, newPassword) => {
    const res = await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
    });
    return res.data;
  },
};
