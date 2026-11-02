import { useNavigate } from "react-router-dom";
import { useCandidates } from "../../hooks/useCandidates";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { useNotifications } from "../../hooks/useNotifications";
import { ROUTES } from "../../routes/routes";
import { CandidatesList } from "./components/CandidatesList";
import { CandidatesListHeader } from "./components/CandidatesListHeader";

export default function CandidatesListPage() {
  const navigate = useNavigate();
  const { onError } = useNotifications();
  const {
    candidates,
    total,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    inputValue,
    handleSearchChange,
    clearSearch,
    loadMore,
  } = useCandidates({ onError });

  const sentinelRef = useInfiniteScroll(loadMore);

  return (
    <>
      <CandidatesListHeader
        total={total}
        loading={loading}
        inputValue={inputValue}
        onSearchChange={handleSearchChange}
        onClear={clearSearch}
      />
      <CandidatesList
        candidates={candidates}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        searchQuery={searchQuery}
        onClearSearch={clearSearch}
        onCandidateClick={(id) =>
          navigate(ROUTES.CANDIDATE_DETAIL.replace(":id", id))
        }
        sentinelRef={sentinelRef}
      />
    </>
  );
}
