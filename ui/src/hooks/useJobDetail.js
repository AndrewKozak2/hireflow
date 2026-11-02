import { useState, useEffect } from "react";
import { JobsService } from "../services/JobsService";

export function useJobDetail(jobId) {
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;

    const loadInitialJob = async () => {
      setIsLoading(true);
      try {
        const data = await JobsService.getById(jobId);
        if (isMounted) {
          setJob(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || err.message || "Failed to fetch job",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInitialJob();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const refresh = async () => {
    if (!jobId) return;
    try {
      const data = await JobsService.getById(jobId);
      setJob(data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch job",
      );
    }
  };

  return { job, isLoading, error, refresh };
}
