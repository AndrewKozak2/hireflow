import { useEffect, useState } from "react";
import { useNotifications } from "../../../hooks/useNotifications";
import { HiringRequestsService } from "../../../services/HiringRequestsService";
import { useAuthStore } from "../../../stores/useAuthStore";

export function useHiringRequests() {
  const { onError, onSuccess } = useNotifications();
  const user = useAuthStore((s) => s.user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const isRecruiterOrAdmin =
    user?.role === "admin" || user?.role === "recruiter";

  useEffect(() => {
    let cancelled = false;

    const fetchFn = isRecruiterOrAdmin
      ? HiringRequestsService.getHiringRequests
      : HiringRequestsService.getMyHiringRequests;

    fetchFn()
      .then((data) => {
        if (!cancelled) setRequests(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) onError({ message: "Failed to load hiring requests" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isRecruiterOrAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTakeInReview = async (request) => {
    try {
      const updated = await HiringRequestsService.takeHiringRequestInReview(
        request.id,
      );
      if (updated) {
        setRequests((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
        onSuccess({ message: "Hiring request taken in review" });
      }
    } catch {
      onError({ message: "Failed to take hiring request in review" });
    }
  };

  return { requests, loading, handleTakeInReview };
}
