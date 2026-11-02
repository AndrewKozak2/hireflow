import {
  Anchor,
  Avatar,
  Badge,
  Group,
  RingProgress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../routes/routes";
import { scoreColor } from "../../utils/scoreColor";

const STAGE_LABELS = {
  new: "New",
  screening: "Screening",
  pre_interview: "Pre-interview",
  technical_interview: "Technical",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const TERMINAL_STAGES = new Set(["hired", "rejected"]);

const STAGE_COLORS = {
  hired: "green",
  rejected: "red",
};

function getInitials(firstName, lastName) {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function formatStageDuration(date) {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
}

export function ApplicationHeader({ application }) {
  const navigate = useNavigate();

  const candidate = application?.candidate;
  const firstName = candidate?.firstName ?? "";
  const lastName = candidate?.lastName ?? "";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Candidate";
  const initials = getInitials(firstName, lastName);

  const stage = application?.stage;
  const stageLabel = stage ? STAGE_LABELS[stage] : null;
  const isActive = stage && !TERMINAL_STAGES.has(stage);

  const jobTitle = application?.job?.title;
  const hiringManagerName = application?.job?.recruiter?.name;

  const lastStageEvent = application?.events
    ?.filter((e) => e.type === "stage_changed" && e.payload?.to === stage)
    ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))?.[0];
  const stageEnteredAt = lastStageEvent?.createdAt ?? application?.createdAt;
  const stageDuration = formatStageDuration(stageEnteredAt);

  const jobId = application?.job?.id;
  const rightMeta = [
    hiringManagerName ? `Owner: ${hiringManagerName}` : null,
    stageLabel && stageDuration
      ? `In ${stageLabel} for ${stageDuration}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const aiScore = application?.aiScore ?? null;
  const color = aiScore !== null ? scoreColor(aiScore) : "gray";

  return (
    <Stack gap="sm">
      <Anchor
        component="button"
        c="dimmed"
        size="sm"
        onClick={() => navigate(ROUTES.APPLICATIONS)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          width: "fit-content",
        }}
      >
        <IconArrowLeft size={14} />
        Back to Applications
      </Anchor>

      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="md" wrap="nowrap">
          <Avatar size={56} radius="xl" color="indigo">
            {initials}
          </Avatar>
          <Stack gap={6}>
            <Group gap="xs" align="center">
              <Title order={3}>{fullName}</Title>
              {isActive && (
                <Badge color="green" variant="light" size="sm">
                  Active
                </Badge>
              )}
              {stageLabel && (
                <Badge
                  color={STAGE_COLORS[stage] ?? "blue"}
                  variant="light"
                  size="sm"
                >
                  {stageLabel}
                </Badge>
              )}
            </Group>
            {(jobTitle || !jobId || rightMeta) && (
              <Text size="sm" c="dimmed">
                {jobTitle && jobId ? (
                  <>
                    {"Applied for: "}
                    <Anchor
                      size="sm"
                      onClick={() =>
                        navigate(ROUTES.JOB_DETAIL.replace(":id", jobId))
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {jobTitle}
                    </Anchor>
                  </>
                ) : (
                  "Applied for: Unassigned"
                )}
                {(jobTitle || !jobId) && rightMeta && " · "}
                {rightMeta}
              </Text>
            )}
          </Stack>
        </Group>

        <Group gap="xl" align="center">
          {aiScore !== null && (
            <RingProgress
              size={80}
              thickness={6}
              roundCaps
              sections={[{ value: aiScore, color }]}
              label={
                <Text size="sm" fw={700} ta="center" c={color}>
                  {aiScore}%
                </Text>
              }
            />
          )}
        </Group>
      </Group>
    </Stack>
  );
}
