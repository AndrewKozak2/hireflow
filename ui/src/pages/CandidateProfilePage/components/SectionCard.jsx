import { Card, Group, Stack, Text } from "@mantine/core";
import classes from "../CandidateProfilePage.module.css";

export function SectionCard({ title, children, rightSection }) {
  return (
    <Card withBorder radius="xl" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="center" gap="md">
          <Text
            size="xs"
            fw={600}
            tt="uppercase"
            c="dimmed"
            className={classes.cardLabel}
          >
            {title}
          </Text>
          {rightSection}
        </Group>
        {children}
      </Stack>
    </Card>
  );
}
