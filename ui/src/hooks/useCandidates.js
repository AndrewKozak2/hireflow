import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CandidatesService } from "../services/CandidatesService";

const LIMIT = 25;

export function useCandidates({ onError } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";

  // Lazy init
  const [inputValue, setInputValue] = useState(
    () => searchParams.get("search") ?? "",
  );

  const [fetchState, setFetchState] = useState({
    query: null,
    candidates: [],
    total: 0,
    page: 1,
    hasMore: true,
    loadingMore: false,
  });

  const fetchingRef = useRef(false);
  const debounceRef = useRef(null);
  const fetchStateRef = useRef(fetchState);

  useLayoutEffect(() => {
    fetchStateRef.current = fetchState;
  });

  const loading = fetchState.query !== searchQuery;

  useEffect(() => {
    let cancelled = false;
    fetchingRef.current = false;

    CandidatesService.getCandidates({
      search: searchQuery,
      page: 1,
      limit: LIMIT,
    })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : (data.items ?? []);
        const total = data.total ?? items.length;
        setFetchState({
          query: searchQuery,
          candidates: items,
          total,
          page: 1,
          hasMore: items.length < total,
          loadingMore: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        onError?.({ message: "Failed to load candidates" });
        setFetchState((prev) => ({
          ...prev,
          query: searchQuery,
          hasMore: false,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    const { hasMore, page, candidates, total, loadingMore, query } =
      fetchStateRef.current;
    if (
      fetchingRef.current ||
      !hasMore ||
      query !== searchQuery ||
      loadingMore
    ) {
      return;
    }

    fetchingRef.current = true;
    setFetchState((prev) => ({ ...prev, loadingMore: true }));
    const nextPage = page + 1;
    const capturedQuery = searchQuery;

    CandidatesService.getCandidates({
      search: capturedQuery,
      page: nextPage,
      limit: LIMIT,
    })
      .then((data) => {
        if (fetchStateRef.current.query !== capturedQuery) return;
        const items = Array.isArray(data) ? data : (data.items ?? []);
        const newTotal = Array.isArray(data)
          ? data.length
          : (data.total ?? total);
        const existingIds = new Set(candidates.map((c) => c.id));
        const merged = [
          ...candidates,
          ...items.filter((c) => !existingIds.has(c.id)),
        ];
        setFetchState((prev) => ({
          ...prev,
          candidates: merged,
          total: newTotal,
          page: nextPage,
          hasMore: merged.length < newTotal,
          loadingMore: false,
        }));
      })
      .catch(() => {
        if (fetchStateRef.current.query !== capturedQuery) return;
        onError?.({ message: "Failed to load more candidates" });
        setFetchState((prev) => ({
          ...prev,
          hasMore: false,
          loadingMore: false,
        }));
      })
      .finally(() => {
        fetchingRef.current = false;
      });
  };

  const handleSearchChange = (value) => {
    setInputValue(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams(value ? { search: value } : {}, { replace: true });
    }, 300);
  };

  const clearSearch = () => {
    clearTimeout(debounceRef.current);
    setInputValue("");
    setSearchParams({}, { replace: true });
  };

  return {
    candidates: fetchState.candidates,
    total: fetchState.total,
    loading,
    loadingMore: fetchState.loadingMore,
    hasMore: fetchState.hasMore,
    searchQuery,
    inputValue,
    handleSearchChange,
    clearSearch,
    loadMore,
  };
}
