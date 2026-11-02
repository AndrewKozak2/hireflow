import { useEffect, useState } from "react";
import { useNotifications } from "../../../hooks/useNotifications";
import { ApplicationsService } from "../../../services/ApplicationsService";

export function useNewApplications() {
  const { onError } = useNotifications();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    ApplicationsService.getApplications({ stage: "new" })
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch(() => {
        if (!cancelled) onError({ message: "Failed to load new applications" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { applications, loading };
}
