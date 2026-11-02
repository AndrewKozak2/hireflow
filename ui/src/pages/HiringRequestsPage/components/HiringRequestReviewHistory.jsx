import {
  Badge,
  Box,
  Card,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { formatShortDate } from "../../../utils/dateFormatters";

const REVIEW_ACTION_META = {
  rejected: {
    label: "Rejected",
    color: "red",
  },
  resubmitted: {
    label: "Resubmitted",
    color: "blue",
  },
};

function formatReviewerName(review) {
  return review.reviewer?.name || review.reviewer?.email || "Unknown reviewer";
}

export function HiringRequestReviewHistory({ reviews = [] }) {
  const theme = useMantineTheme();
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  return (
    <Card
      radius="lg"
      p="lg"
      style={{
        border: `1px solid ${theme.other.appColors.border}`,
        backgroundColor: theme.other.appColors.surface,
      }}
    >
      <Title order={5} mb="md">
        Review History
      </Title>

      {sortedReviews.length === 0 ? (
        <Text size="sm" c="dimmed">
          No review history yet
        </Text>
      ) : (
        <Stack gap="md">
          {sortedReviews.map((review) => {
            const meta = REVIEW_ACTION_META[review.action] ?? {
              label: review.action,
              color: "gray",
            };

            return (
              <Box key={review.id}>
                <Group justify="space-between" gap="sm" align="flex-start">
                  <Group gap="xs">
                    <Badge variant="light" color="gray">
                      Round {review.round}
                    </Badge>
                    <Badge variant="light" color={meta.color}>
                      {meta.label}
                    </Badge>
                  </Group>

                  <Text size="xs" c="dimmed">
                    {formatShortDate(review.created_at)}
                  </Text>
                </Group>

                <Text size="sm" fw={600} mt="xs">
                  {formatReviewerName(review)}
                </Text>

                {review.reason ? (
                  <Box
                    mt="sm"
                    p="sm"
                    style={{
                      borderLeft: `3px solid ${theme.colors.red[6]}`,
                      backgroundColor: theme.colors.red[0],
                      borderRadius: theme.radius.sm,
                    }}
                  >
                    <Text size="sm" c={theme.colors.gray[8]}>
                      {review.reason}
                    </Text>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
