import {
  Card,
  Stack,
  Text,
  Group,
  Box,
  Avatar,
  useMantineTheme,
} from "@mantine/core";

export function HiringManagerNotesCard({ notes, authorName, date }) {
  const theme = useMantineTheme();

  if (!notes?.trim()) {
    return null;
  }

  return (
    <Card
      radius="lg"
      p="lg"
      style={{
        border: `1px solid ${theme.colors.gray[2]}`,
        backgroundColor: theme.white,
      }}
    >
      <Stack gap="sm">
        <Text
          size="xs"
          fw={700}
          tt="uppercase"
          c={theme.colors.gray[6]}
          style={{ letterSpacing: "0.06em" }}
        >
          Notes for recruiter from HM
        </Text>

        <Box
          p="sm"
          style={{
            border: `1px solid ${theme.colors.gray[2]}`,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.gray[0],
          }}
        >
          <Group justify="space-between" align="flex-start" mb="xs">
            <Group gap="xs">
              {authorName && (
                <Avatar size="sm" radius="xl" color="blue">
                  {authorName.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Stack gap={0}>
                <Text size="sm" fw={600} c={theme.colors.gray[9]}>
                  {authorName || "Hiring Manager"}
                </Text>
                <Text size="xs" c={theme.colors.gray[6]}>
                  Hiring Manager
                </Text>
              </Stack>
            </Group>
            {date && (
              <Text size="xs" c={theme.colors.gray[5]}>
                {date}
              </Text>
            )}
          </Group>
          <Text
            size="sm"
            c={theme.colors.gray[8]}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {notes}
          </Text>
        </Box>
      </Stack>
    </Card>
  );
}
