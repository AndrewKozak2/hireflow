import { create } from "zustand";
import { NotificationsService } from "../services/NotificationsService";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  fetchNotifications: async (isBackground = false) => {
    if (!isBackground) set({ isLoading: true });
    try {
      const response = await NotificationsService.getNotifications();
      const data = response.data ?? response;
      set({ notifications: data, error: null });
    } catch (error) {
      set({ error: error.message || "Failed to fetch notifications" });
    } finally {
      if (!isBackground) set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    const previous = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      ),
    }));

    try {
      await NotificationsService.markAsRead(id);
    } catch (error) {
      set({ notifications: previous });
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    const previous = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        is_read: true,
      })),
    }));

    try {
      await NotificationsService.markAllAsRead();
    } catch (error) {
      set({ notifications: previous });
      console.error("Failed to mark all as read:", error);
    }
  },

  clearAll: async () => {
    const previous = get().notifications;
    set({ notifications: [] });

    try {
      await NotificationsService.clearAll();
    } catch (error) {
      set({ notifications: previous });
      console.error("Failed to clear notifications:", error);
    }
  },
}));

export const selectUnreadCount = (state) =>
  state.notifications.filter((n) => !n.is_read).length;
