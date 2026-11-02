import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { ROLES } from "../constants/roles";
import { useJobsStore } from "../stores/useJobsStore";
import { JobsService } from "../services/JobsService";

export function useJobs() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    draft: 0,
    pending_approval: 0,
    active: 0,
    paused: 0,
    closed: 0,
    rejected: 0,
  });

  const jobs = useJobsStore((state) => state.jobs);
  const isLoading = useJobsStore((state) => state.isLoading);
  const error = useJobsStore((state) => state.error);
  const activeTab = useJobsStore((state) => state.activeTab);
  const setActiveTab = useJobsStore((state) => state.setActiveTab);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await JobsService.getStatusCounts();
      setCounts(response.data ?? response);
    } catch (err) {
      console.error("Failed to fetch job counts:", err);
    }
  }, []);

  const fetchJobs = useCallback(() => {
    useJobsStore.getState().fetchJobs();
    fetchCounts();
  }, [fetchCounts]);

  const updateJobStatus = async (id, status) => {
    await useJobsStore.getState().updateJobStatus(id, status);
    fetchJobs();
  };

  const deleteJob = async (id) => {
    await useJobsStore.getState().deleteJob(id);
    fetchJobs();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    if (user?.role === ROLES.MANAGER) {
      return jobs.filter((job) => job.hiringManagerId === user.id);
    }
    return jobs;
  }, [jobs, user]);

  return {
    jobs: filteredJobs,
    counts,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    updateJobStatus,
    deleteJob,
    refreshJobs: fetchJobs,
    canCreateJob: user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN,
  };
}
