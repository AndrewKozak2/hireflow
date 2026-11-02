import { useState, useEffect } from "react";
import { AnalyticsService } from "../../../services/AnalyticsService";

export function useAnalyticsStats() {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    AnalyticsService.getDashboardStats()
      .then((res) => {
        if (cancelled) return;
        setStats(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.error("Error fetching analytics stats:", err);
        if (!cancelled) setStats([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading };
}
