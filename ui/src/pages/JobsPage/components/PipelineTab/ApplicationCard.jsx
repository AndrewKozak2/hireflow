import React, { useState } from "react";
import {
  Paper,
  Text,
  Group,
  Badge,
  Box,
  useMantineTheme,
  RingProgress,
  Tooltip,
  Popover,
  Button,
  Stack,
} from "@mantine/core";
import { useDraggable } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";
import { STAGES, SOURCE_META } from "../../../../constants/application";
import { ROUTES } from "../../../../routes/routes";

export function ApplicationCard({
  application,
  isOverlay,
  moveApplication,
  onHireRequest,
  isPipelineLocked = false,
}) {
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: application.id,
    });
  const isLocked =
    isPipelineLocked || ["hired", "rejected"].includes(application.stage);
  const dragProps = isLocked ? {} : { ...attributes, ...listeners };
  const navigate = useNavigate();

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.3 : 1,
    cursor: isLocked ? "default" : isDragging ? "grabbing" : "grab",
    position: "relative",
    backgroundColor: "white",
    borderColor: isDragging ? "#228be6" : undefined,
  };

  const candidateName =
    `${application.candidate?.firstName || ""} ${application.candidate?.lastName || ""}`.trim() ||
    "Unknown Candidate";

  const daysInStage = calculateDaysInStage(application.updatedAt);
  const aiScore = application.aiScore || application.ai_score;
  const isAnalyzing =
    application.aiStatus === "processing" ||
    application.ai_status === "processing";

  const handleCardClick = () => {
    if (isDragging) return;
    navigate(ROUTES.APPLICATION_DETAIL.replace(":id", application.id));
  };

  const nextStage = getNextStage(application.stage);
  const stopCardInteraction = (event) => {
    event.stopPropagation();
  };
  const handleMoveBadgeClick = (event) => {
    event.stopPropagation();
    setIsMovePopoverOpen((opened) => !opened);
  };
  const handleMoveConfirm = (event) => {
    event.stopPropagation();
    setIsMovePopoverOpen(false);
    if (nextStage.id === "hired") {
      // Open hire confirmation modal instead of directly changing stage
      onHireRequest?.(application);
    } else {
      moveApplication(application.id, nextStage.id);
    }
  };

  return (
    <Paper
      ref={setNodeRef}
      {...dragProps}
      style={style}
      withBorder
      p="md"
      radius="md"
      shadow={isOverlay ? "md" : "xs"}
      onClick={handleCardClick}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text fw={700} size="sm" lineClamp={1}>
            {candidateName}
          </Text>
          <AiScoreBadge score={aiScore} isAnalyzing={isAnalyzing} />
        </Group>

        <Group justify="space-between">
          <Badge size="xs" variant="outline" color={getDayColor(daysInStage)}>
            {daysInStage}d
          </Badge>
          <SourceBadge source={application.source} />
        </Group>

        {nextStage && !isPipelineLocked && (
          <Group justify="flex-end">
            <Popover
              width={200}
              position="bottom"
              withArrow
              shadow="md"
              opened={isMovePopoverOpen}
              onChange={setIsMovePopoverOpen}
            >
              <Popover.Target>
                <Badge
                  size="xs"
                  variant="light"
                  color="blue"
                  rightSection={<IconChevronRight size={10} />}
                  style={{ cursor: "pointer" }}
                  onPointerDown={stopCardInteraction}
                  onMouseDown={stopCardInteraction}
                  onClick={handleMoveBadgeClick}
                >
                  {nextStage.label}
                </Badge>
              </Popover.Target>
              <Popover.Dropdown
                onPointerDown={stopCardInteraction}
                onMouseDown={stopCardInteraction}
                onClick={stopCardInteraction}
              >
                <Text size="xs" mb="xs">
                  Move to {nextStage.label}?
                </Text>
                <Group justify="flex-end">
                  <Button
                    size="compact-xs"
                    variant="filled"
                    onClick={handleMoveConfirm}
                  >
                    Confirm
                  </Button>
                </Group>
              </Popover.Dropdown>
            </Popover>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

function AiScoreBadge({ score, isAnalyzing }) {
  const theme = useMantineTheme();

  if (isAnalyzing) {
    return (
      <Tooltip label="AI is analyzing candidate...">
        <RingProgress
          size={24}
          thickness={3}
          sections={[{ value: 100, color: "blue" }]}
        />
      </Tooltip>
    );
  }

  if (score === undefined || score === null) return null;

  const color = score >= 70 ? "green" : score >= 40 ? "orange" : "red";

  return (
    <Tooltip label={`AI Score: ${score}%`}>
      <Box
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: theme.colors[color][6],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.white,
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {score}
      </Box>
    </Tooltip>
  );
}

function SourceBadge({ source }) {
  const s = source?.toLowerCase() || "manual";
  const { color, label } = SOURCE_META[s] || SOURCE_META.manual;

  return (
    <Badge size="xs" variant="light" color={color}>
      {label}
    </Badge>
  );
}

function calculateDaysInStage(updatedAt) {
  if (!updatedAt) return 0;
  const lastUpdate = new Date(updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now - lastUpdate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getDayColor(days) {
  if (days >= 10) return "red";
  if (days >= 5) return "orange";
  return "gray";
}

function getNextStage(currentStage) {
  const activeStages = STAGES.filter(
    (s) => s.id !== "rejected" && s.id !== "hired",
  );
  const currentIndex = activeStages.findIndex((s) => s.id === currentStage);
  if (currentIndex === -1 || currentIndex === activeStages.length - 1)
    return null;
  return activeStages[currentIndex + 1];
}
