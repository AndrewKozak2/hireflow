import { useEffect, useState } from "react";
import { UsersService } from "../../../services/UsersService";
import { useNotifications } from "../../../hooks/useNotifications";
import { useAuthStore } from "../../../stores/useAuthStore";

export function useHiringRequestFormState() {
  const [fetchedManagers, setFetchedManagers] = useState([]);
  const { onError } = useNotifications();
  const user = useAuthStore((s) => s.user);

  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    if (!user || user.role === "hiring_manager") return;
    let cancelled = false;
    UsersService.getManagerOptions()
      .then((options) => {
        if (!cancelled) setFetchedManagers(options);
      })
      .catch(() => {
        if (!cancelled) onError({ message: "Failed to load managers" });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const managers =
    user?.role === "hiring_manager" && user.id
      ? [{ value: user.id, label: user.email }]
      : fetchedManagers;

  return { managers, today };
}
