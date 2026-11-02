import { Text, Paper, Badge, Group, Avatar, Stack } from "@mantine/core";
import { useDateTime } from "../../../hooks/useDateTime";
import { StatusBadge } from "./StatusBadge";

export function ApprovalHistory({ approvals = [] }) {
  const { formatRelativeDate } = useDateTime();

  const chronologicalApprovals = [...approvals].reverse();
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Stack gap="md">
      {chronologicalApprovals.map((approval, index) => {
        const roundNumber = index + 1;

        return (
          <Paper key={approval.id} withBorder p="md" radius="sm" shadow="none">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <Badge
                    variant="filled"
                    color="gray.2"
                    c="gray.8"
                    radius="xl"
                    size="sm"
                    styles={{
                      label: { textTransform: "none", fontWeight: 600 },
                    }}
                  >
                    Round {roundNumber}
                  </Badge>

                  <Avatar radius="xl" size="sm" color="violet">
                    {getInitials(approval.userName)}
                  </Avatar>

                  <Text size="sm" fw={700} c="dark.4">
                    {approval.action} by {approval.userName}
                  </Text>

                  <StatusBadge status={approval.status} />
                </Group>

                <Text size="xs" c="dimmed">
                  {formatRelativeDate(approval.createdAt)}
                </Text>
              </Group>

              {approval.notes && (
                <div
                  style={{
                    borderLeft: "3px solid #fa5252",
                    paddingLeft: "12px",
                    marginTop: "4px",
                  }}
                >
                  <Text size="sm" c="gray.7" style={{ fontStyle: "italic" }}>
                    "{approval.notes}"
                  </Text>
                </div>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
