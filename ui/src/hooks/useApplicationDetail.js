import { useState, useEffect, useCallback } from "react";
import { ApplicationsService } from "../services/ApplicationsService";

export function useApplicationDetail(id) {
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!id || id === "undefined") {
      setError("Invalid application ID");
      setIsLoading(false);
      return;
    }
    try {
      const data = await ApplicationsService.getApplication(id);
      setApplication(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const executeFetch = async () => {
      await loadData();
    };
    executeFetch();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  return { application, isLoading, error, refresh: handleRefresh };
}
