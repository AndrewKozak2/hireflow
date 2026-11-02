import { apiClient } from "./AxiosService";

const API_URL = "/users";
const INVITE_URL = "/auth/invite";
const INVITATION_URL = "/auth/invitations";

export const UsersService = {
  getUsers: () => {
    return apiClient.get(API_URL);
  },

  getManagerOptions: () =>
    apiClient
      .get(API_URL)
      .then((users) =>
        users
          .filter(
            (u) =>
              (u.role === "hiring_manager" || u.role === "admin") && u.name,
          )
          .map((u) => ({ value: u.id, label: u.name })),
      ),

  getInvites: () => {
    return apiClient.get(INVITATION_URL);
  },

  changeUserRole: (id, role) => {
    return apiClient.patch(`${API_URL}/${id}/role`, { role });
  },

  deactivateUser: (id) => {
    return apiClient.patch(`${API_URL}/${id}/deactivate`);
  },

  reactivateUser: (id) => {
    return apiClient.patch(`${API_URL}/${id}/reactivate`);
  },

  resendInvite: (id) => {
    return apiClient.post(`${INVITE_URL}/${id}/resend`);
  },
};
