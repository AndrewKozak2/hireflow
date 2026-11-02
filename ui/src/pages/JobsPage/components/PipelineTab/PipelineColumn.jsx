import React from "react";
import {
  Paper,
  Text,
  Group,
  ActionIcon,
  Stack,
  Box,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useDroppable } from "@dnd-kit/core";
import { ApplicationCard } from "./ApplicationCard";
import { STAGE_MAPPING } from "../../../../constants/application";

export function PipelineColumn({
  id,
  title,
  count,
  applications,
  isCollapsed,
  onToggle,
  moveApplication,
  onHireRequest,
  isPipelineLocked = false,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    disabled: isPipelineLocked,
  });
  const theme = useMantineTheme();

  if (isCollapsed) {
    return (
      <Paper
        withBorder
        p="xs"
        w={50}
        h={600}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: theme.colors.gray[0],
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <ActionIcon variant="subtle" size="sm" mb="sm">
          <IconChevronRight size={16} />
        </ActionIcon>
        <Text
          size="xs"
          fw={700}
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            whiteSpace: "nowrap",
          }}
        >
          {title} ({count})
        </Text>
      </Paper>
    );
  }

  return (
    <Box
      ref={setNodeRef}
      w={280}
      mih={600}
      style={{
        borderRadius: theme.radius.md,
        backgroundColor: isOver ? theme.colors.blue[0] : theme.colors.gray[0],
        transition: "background-color 0.2s ease",
        border: isOver
          ? `2px dashed ${theme.colors.blue[4]}`
          : "2px solid transparent",
      }}
    >
      <Paper
        p="sm"
        withBorder
        mb="md"
        radius="md"
        style={{
          backgroundColor: theme.white,
          borderBottom: `3px solid ${getColumnColor(id, theme)}`,
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={700} size="sm">
              {title}
            </Text>
            <Text size="xs" c="dimmed" fw={500}>
              {count}
            </Text>
          </Group>
          <ActionIcon variant="subtle" size="sm" onClick={onToggle}>
            <IconChevronLeft size={16} />
          </ActionIcon>
        </Group>
      </Paper>

      <Stack gap="sm" p="xs">
        {applications.length > 0 ? (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              moveApplication={moveApplication}
              onHireRequest={onHireRequest}
              isPipelineLocked={isPipelineLocked}
            />
          ))
        ) : (
          <Box
            p="xl"
            style={{
              border: `1px dashed ${theme.colors.gray[4]}`,
              borderRadius: theme.radius.md,
              textAlign: "center",
            }}
          >
            <Text size="xs" c="dimmed">
              No candidates at this stage
            </Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function getColumnColor(id, theme) {
  const color = STAGE_MAPPING[id]?.color || "gray";
  return theme.colors[color][5];
}
