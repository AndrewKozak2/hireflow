import { apiClient } from "./AxiosService";

export const NotificationsService = {
  getNotifications: () => apiClient.get("/notifications"),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch("/notifications/read-all"),
  clearAll: () => apiClient.delete("/notifications/clear-all"),
};
