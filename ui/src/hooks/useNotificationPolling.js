import { useEffect } from "react";
import { useNotificationStore } from "../stores/useNotificationStore";

export function useNotificationPolling(isAuthenticated) {
  const { fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = (isBackground = false) => {
      if (document.visibilityState === "visible") {
        fetchNotifications(isBackground);
      }
    };

    poll(false);
    let intervalId =
      document.visibilityState === "visible"
        ? setInterval(() => poll(true), 60000)
        : null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        poll(true);
        intervalId = setInterval(() => poll(true), 60000);
      } else {
        clearInterval(intervalId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, fetchNotifications]);
}
