import {
  Box,
  Flex,
  Group,
  Text,
  Avatar,
  Badge,
  Stack,
  Anchor,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export function NewApplicationsList({ applications, onViewAll }) {
  const getInitials = (name) => {
    if (name.includes("@")) return "@";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="md">
        <Group gap="xs">
          <Text fw={600} size="lg">
            New Applications
          </Text>
          <Text size="sm" c="dimmed">
            {applications.length} unreviewed
          </Text>
        </Group>
        <Anchor size="sm" c="blue" fw={500} onClick={onViewAll}>
          View all →
        </Anchor>
      </Flex>

      <Stack gap="sm">
        {applications.map((app) => (
          <Flex
            key={app.id}
            justify="space-between"
            align="center"
            py="xs"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}
          >
            <Group gap="sm">
              <Avatar color={app.avatarColor || "blue"} radius="xl" size="md">
                {getInitials(app.name)}
              </Avatar>
              <Box>
                <Text
                  fw={500}
                  size="sm"
                  c={app.name.includes("@") ? "blue.6" : "black"}
                >
                  {app.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {app.role}
                </Text>
                {app.role === "Not matched" && (
                  <Group gap={4} mt={2}>
                    <IconAlertCircle
                      size={12}
                      color="var(--mantine-color-red-6)"
                    />
                    <Text size="xs" c="red.6">
                      Not matched
                    </Text>
                  </Group>
                )}
              </Box>
            </Group>

            <Group gap="xs">
              <Badge
                variant="light"
                color={
                  app.source === "Djinni"
                    ? "green"
                    : app.source === "LinkedIn"
                      ? "blue"
                      : "violet"
                }
              >
                {app.source}
              </Badge>
              {app.match && (
                <Badge
                  variant={app.match === "NO CV" ? "filled" : "light"}
                  color={app.match === "NO CV" ? "gray" : "green"}
                  radius="xl"
                >
                  {app.match}
                </Badge>
              )}
              {!app.match && app.source === "LinkedIn" && (
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "2px solid var(--mantine-color-gray-3)",
                  }}
                />
              )}
              <Text
                size="xs"
                c="dimmed"
                style={{ minWidth: "45px" }}
                ta="right"
              >
                {app.time}
              </Text>
            </Group>
          </Flex>
        ))}
      </Stack>
    </Box>
  );
}
