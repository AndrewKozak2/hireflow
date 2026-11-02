import {
  Avatar,
  Badge,
  Button,
  Flex,
  Group,
  Stack,
  Text,
  UnstyledButton,
  Box,
} from "@mantine/core";
import {
  DASHBOARD_STATUS_COLOR,
  DASHBOARD_STATUS_LABEL,
} from "../../../constants/hiringRequestConstants";
import { useDateTime } from "../../../hooks/useDateTime";
import classes from "./HiringRequestsTable.module.css";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function HiringRequestsTable({
  requests,
  isRecruiterOrAdmin,
  onTakeInReview,
  onView,
}) {
  const { formatRelativeDate } = useDateTime();
  return (
    <Stack gap={0} w="100%">
      {requests.map((req) => {
        const authorName = req.created_by?.name || req.submitter_email || "—";

        return (
          <Flex
            key={req.id}
            align="center"
            gap="md"
            className={classes.row}
            w="100%"
            wrap="nowrap"
          >
            <UnstyledButton
              onClick={() => onView?.(req.id)}
              style={{ flex: 1, minWidth: 0, textAlign: "left" }}
            >
              <Flex align="center" gap="md" wrap="nowrap">
                <Avatar color="blue" radius="xl" size="md">
                  {getInitials(authorName)}
                </Avatar>
                <Stack gap={2} style={{ overflow: "hidden" }}>
                  <Text fw={600} size="sm" c="blue.7" truncate>
                    {req.job_title}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {authorName}
                    {req.created_at
                      ? ` · ${formatRelativeDate(req.created_at)}`
                      : ""}
                  </Text>
                </Stack>
              </Flex>
            </UnstyledButton>

            <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
              <Badge
                color={DASHBOARD_STATUS_COLOR[req.status] ?? "gray"}
                variant="light"
                size="md"
                className={classes.statusBadge}
              >
                {DASHBOARD_STATUS_LABEL[req.status] ?? req.status}
              </Badge>

              <Box className={classes.actionContainer}>
                {isRecruiterOrAdmin && req.status === "pending" && (
                  <Button
                    size="xs"
                    color="orange"
                    className={classes.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTakeInReview?.(req);
                    }}
                  >
                    Take in review
                  </Button>
                )}
                {isRecruiterOrAdmin && req.status === "in_review" && (
                  <Button
                    size="xs"
                    color="green"
                    className={classes.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.(req.id);
                    }}
                  >
                    Create Job
                  </Button>
                )}
              </Box>
            </Group>
          </Flex>
        );
      })}
    </Stack>
  );
}
