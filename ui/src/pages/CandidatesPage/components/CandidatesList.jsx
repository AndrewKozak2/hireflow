import { Anchor, Center, Paper, Stack, Text } from "@mantine/core";
import { PageLoader } from "../../../components/PageLoader";
import { CandidateRow } from "./CandidateRow";

export function CandidatesList({
  candidates,
  loading,
  loadingMore,
  hasMore,
  error,
  searchQuery,
  onClearSearch,
  onCandidateClick,
  sentinelRef,
}) {
  const isEmpty = !loading && candidates.length === 0;

  return (
    <Paper withBorder radius="md" px="lg" py={0}>
      {loading && <PageLoader />}

      {isEmpty && searchQuery && (
        <Center py="xl">
          <Stack align="center" gap={4}>
            <Text c="dimmed">
              No candidates matching &ldquo;{searchQuery}&rdquo;
            </Text>
            <Anchor component="button" size="sm" onClick={onClearSearch}>
              Clear search
            </Anchor>
          </Stack>
        </Center>
      )}

      {isEmpty && !searchQuery && (
        <Center py="xl">
          <Text c="dimmed">
            No candidates yet. They&apos;ll appear here as applications come in.
          </Text>
        </Center>
      )}

      {!loading && candidates.length > 0 && (
        <Stack gap={0}>
          {candidates.map((candidate) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              onClick={() => onCandidateClick(candidate.id)}
            />
          ))}
        </Stack>
      )}

      <div ref={sentinelRef}>
        {loadingMore && <PageLoader size="sm" py="md" />}
        {!loading && !loadingMore && !hasMore && candidates.length > 0 && (
          <Text c="dimmed" size="xs" ta="center" py="md">
            All candidates loaded
          </Text>
        )}
      </div>
    </Paper>
  );
}
