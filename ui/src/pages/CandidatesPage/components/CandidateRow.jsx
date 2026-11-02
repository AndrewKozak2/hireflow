import { Avatar, Box, Flex, Group, Text, Tooltip } from "@mantine/core";
import {
  formatExactDate,
  formatRelativeTime,
} from "../../../utils/dateFormatters";
import classes from "./CandidateRow.module.css";

const AVATAR_COLORS = [
  "blue",
  "cyan",
  "teal",
  "green",
  "grape",
  "violet",
  "indigo",
  "orange",
  "pink",
  "red",
];

function getAvatarColor(fullName) {
  const code = [...fullName].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getInitials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export function CandidateRow({ candidate, onClick }) {
  const { firstName, lastName, email, lastActivityAt } = candidate;
  const fullName = `${firstName} ${lastName}`;
  const initials = getInitials(firstName, lastName);
  const avatarColor = getAvatarColor(fullName);
  const relativeTime = formatRelativeTime(lastActivityAt);
  const exactDate = formatExactDate(lastActivityAt);

  return (
    <Box onClick={onClick} className={classes.row}>
      <Flex align="center" gap="md">
        <Avatar color={avatarColor} radius="xl" size="md">
          {initials}
        </Avatar>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} mb={4} wrap="nowrap">
            <Text
              fw={600}
              size="sm"
              style={{ whiteSpace: "nowrap", textDecoration: "none" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {fullName}
            </Text>
            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
              {email}
            </Text>
          </Group>

          {/* Application chips — stub */}
          <Text size="xs" c="dimmed">
            —
          </Text>
        </Box>

        {/* AI Score — stub */}
        <Box w={56} style={{ textAlign: "center", flexShrink: 0 }}>
          <Text size="sm" c="dimmed">
            —
          </Text>
        </Box>

        {/* Last activity */}
        <Box w={80} style={{ textAlign: "right", flexShrink: 0 }}>
          {relativeTime ? (
            <Tooltip label={exactDate} withArrow position="top">
              <Text size="xs" c="dimmed" style={{ display: "inline" }}>
                {relativeTime}
              </Text>
            </Tooltip>
          ) : (
            <Text size="xs" c="dimmed">
              —
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
