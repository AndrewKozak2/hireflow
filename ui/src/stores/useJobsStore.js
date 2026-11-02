import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as Sentry from "@sentry/react";
import { JobsService } from "../services/JobsService";
import { useAuthStore } from "./useAuthStore";

const mapJob = (job) => ({
  ...job,
  recruiter: job.recruiter?.name || "Unknown",
  hiringManager: job.hiringManager?.name || "Unknown",
  candidatesCount: job.candidates_count || 0,
  createdAt: job.created_at || "N/A",
});

export const useJobsStore = create(
  persist(
    (set, get) => ({
      jobs: [],
      isLoading: false,
      error: null,
      activeTab: "all",

      setJobs: (jobs) => set({ jobs }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setActiveTab: (activeTab) => {
        set({ activeTab });
        get().fetchJobs(activeTab);
      },

      fetchJobs: async (tabOverride) => {
        await useAuthStore.persist.rehydrate();

        const token = useAuthStore.getState().accessToken;
        if (!token) {
          set({ isLoading: false, error: "Not authenticated" });
          return;
        }

        const activeTab = tabOverride ?? get().activeTab;
        const params = activeTab !== "all" ? { status: activeTab } : {};

        set({ isLoading: true, error: null });
        try {
          const data = await JobsService.getAll(params);
          const jobsData = (
            Array.isArray(data) ? data : (data?.data ?? [])
          ).map(mapJob);
          set({ jobs: jobsData, isLoading: false });
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch jobs";
          set({ error: errorMessage, isLoading: false });
          Sentry.captureException(err);
        }
      },

      updateJobStatus: async (id, status) => {
        try {
          await JobsService.updateStatus(id, status);
          set((state) => ({
            jobs: state.jobs.map((job) =>
              job.id === id ? { ...job, status } : job,
            ),
          }));
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to update status";
          set({ error: errorMessage });
          Sentry.captureException(err);
          throw err;
        }
      },

      deleteJob: async (id) => {
        try {
          await JobsService.delete(id);
          set((state) => ({
            jobs: state.jobs.filter((job) => job.id !== id),
          }));
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to delete job";
          set({ error: errorMessage });
          Sentry.captureException(err);
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "jobs-storage",
      partialize: (state) => ({ activeTab: state.activeTab }),
    },
  ),
);
