import React from "react";
import { Box, Card, Group, Text, useMantineTheme } from "@mantine/core";
import { IconCheck, IconX, IconPlayerPause } from "@tabler/icons-react";

function Step({ label, state, value }) {
  const theme = useMantineTheme();
  const isRejectedOrClosed = state === "rejected" || state === "closed";
  const isPaused = state === "paused";
  const isActive =
    state === "current" || state === "done" || isRejectedOrClosed || isPaused;

  let backgroundColor = theme.colors.gray[2];
  let borderColor = theme.colors.gray[3];
  let textColor = theme.colors.gray[6];

  if (state === "done") {
    backgroundColor = theme.colors.success?.[7] || theme.colors.green[6];
    borderColor = theme.colors.success?.[7] || theme.colors.green[6];
    textColor = theme.colors.success?.[7] || theme.colors.green[7];
  } else if (state === "current") {
    backgroundColor = theme.colors.indigo[6];
    borderColor = theme.colors.indigo[6];
    textColor = theme.colors.indigo[7];
  } else if (isPaused) {
    backgroundColor = theme.colors.blue[6];
    borderColor = theme.colors.blue[6];
    textColor = theme.colors.blue[7];
  } else if (isRejectedOrClosed) {
    backgroundColor = theme.colors.red[6];
    borderColor = theme.colors.red[6];
    textColor = theme.colors.red[7];
  }

  return (
    <Group gap={8} wrap="nowrap">
      <Box
        style={{
          width: "1.75rem",
          height: "1.75rem",
          borderRadius: "9999px",
          display: "grid",
          placeItems: "center",
          fontSize: theme.fontSizes.xs,
          fontWeight: 700,
          color: isActive ? theme.white : theme.colors.gray[6],
          backgroundColor,
          border: `1px solid ${borderColor}`,
          boxShadow:
            state === "current"
              ? `0 0 0 0.25rem ${theme.colors.indigo[0]}`
              : isPaused
                ? `0 0 0 0.25rem ${theme.colors.blue[0]}`
                : isRejectedOrClosed
                  ? `0 0 0 0.25rem ${theme.colors.red[0]}`
                  : "none",
        }}
      >
        {state === "done" ? (
          <IconCheck size={14} stroke={2.5} />
        ) : isRejectedOrClosed ? (
          <IconX size={14} stroke={2.5} />
        ) : isPaused ? (
          <IconPlayerPause size={12} fill="currentColor" />
        ) : (
          value
        )}
      </Box>
      <Text
        size="sm"
        fw={600}
        style={{ color: textColor, whiteSpace: "nowrap" }}
      >
        {label}
      </Text>
    </Group>
  );
}

function StepConnector({ done = false, color }) {
  const theme = useMantineTheme();
  const activeColor =
    color ?? (theme.colors.success?.[7] || theme.colors.green[6]);

  return (
    <Box
      style={{
        flex: 1,
        minWidth: "1rem",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      <Box
        style={{
          width: "100%",
          height: "0.125rem",
          backgroundColor: done ? activeColor : theme.colors.gray[2],
        }}
      />
    </Box>
  );
}

export function StatusTimeline({ stages }) {
  const theme = useMantineTheme();

  return (
    <Card
      radius="lg"
      py="14px"
      px="16px"
      style={{
        border: `1px solid ${
          theme.other?.appColors?.border || theme.colors.gray[2]
        }`,
        backgroundColor: theme.other?.appColors?.surface || theme.white,
      }}
    >
      <Group gap={0} wrap="nowrap">
        {stages.map((stage, index) => {
          if (!stage) return null;
          const isLast = index === stages.length - 1;
          const nextStage = stages[index + 1];

          return (
            <React.Fragment key={index}>
              <Step label={stage.label} state={stage.state} value={index + 1} />
              {!isLast && (
                <StepConnector
                  done={nextStage.state !== "default"}
                  color={
                    stage.state === "rejected" && nextStage.state === "rejected"
                      ? theme.colors.red[6]
                      : nextStage.state === "paused"
                        ? theme.colors.blue[6]
                        : undefined
                  }
                />
              )}
            </React.Fragment>
          );
        })}
      </Group>
    </Card>
  );
}
