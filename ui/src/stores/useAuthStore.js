import * as Sentry from "@sentry/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAuthChecking: true,

      setAccessToken: (token) =>
        set({
          accessToken: token,
          isAuthenticated: !!token,
        }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setIsAuthChecking: (isAuthChecking) =>
        set({
          isAuthChecking,
        }),

      setUserInfo: (user) => {
        set({ user, isAuthenticated: true });
        if (user) {
          Sentry.setUser({
            id: user.id,
            email: user.email,
            role: user.role,
          });
        }
      },

      logout: () => {
        (set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isAuthChecking: false,
        }),
          Sentry.setUser(null));
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
