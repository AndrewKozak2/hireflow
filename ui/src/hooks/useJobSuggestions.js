import { useEffect, useState } from "react";
import { ApplicationsService } from "../services/ApplicationsService";
import { useAuthStore } from "../stores/useAuthStore";
import { ROLES } from "../constants/roles";

const CAN_ASSIGN = [ROLES.ADMIN, ROLES.RECRUITER];
const NONE = {};

/**
 * Suggested jobs for the given unassigned applications, keyed by application
 * ID. Only admins and recruiters can assign jobs, so nobody else fetches them.
 * Suggestions are a hint: if the request fails the UI simply shows none.
 */
export function useJobSuggestions(applicationIds) {
  const role = useAuthStore((s) => s.user?.role);
  const canAssign = CAN_ASSIGN.includes(role);
  const key = [...new Set(applicationIds.filter(Boolean))].sort().join(",");
  // Results are stored with the key they were loaded for, so a stale result
  // for another set of applications is never shown.
  const [loaded, setLoaded] = useState({ key: "", data: NONE });

  useEffect(() => {
    if (!canAssign || !key) return;

    let isMounted = true;
    ApplicationsService.getJobSuggestions(key.split(","))
      .then((response) => {
        // apiClient already returns the response body
        if (isMounted) setLoaded({ key, data: response ?? NONE });
      })
      .catch((error) => {
        console.error("Failed to load job suggestions:", error);
        if (isMounted) setLoaded({ key, data: NONE });
      });

    return () => {
      isMounted = false;
    };
  }, [canAssign, key]);

  return canAssign && key && loaded.key === key ? loaded.data : NONE;
}
