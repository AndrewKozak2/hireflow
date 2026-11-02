import {
  Badge,
  Card,
  Group,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useDateTime } from "../../../../hooks/useDateTime";
import { scoreColor } from "../../utils/scoreColor";

const RECOMMENDATION_MAP = {
  proceed: { label: "PROCEED", color: "green" },
  review: { label: "REVIEW", color: "yellow" },
  reject: { label: "REJECT", color: "red" },
};

export function AIScreeningCard({ application }) {
  const { formatRelativeDate } = useDateTime();

  const aiScore = application?.aiScore ?? null;
  const aiSummary = application?.aiSummary ?? null;
  const aiRecommendation = application?.aiRecommendation ?? null;
  const skills = application?.candidate?.skills ?? [];

  const screeningEvent = application?.events?.find(
    (e) => e.type === "ai_screening_completed",
  );
  const isPending = aiScore === null;
  const completedLabel =
    !isPending && screeningEvent?.createdAt
      ? `Completed ${formatRelativeDate(screeningEvent.createdAt)}`
      : null;
  const rec = aiRecommendation ? RECOMMENDATION_MAP[aiRecommendation] : null;
  const color = isPending ? "gray" : scoreColor(aiScore);

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <ThemeIcon color="violet" variant="light" size="sm" radius="sm">
              <IconSparkles size={12} />
            </ThemeIcon>
            <Text fw={600} size="sm">
              AI Screening Result
            </Text>
          </Group>
          {completedLabel && (
            <Text size="xs" c="dimmed">
              {completedLabel}
            </Text>
          )}
        </Group>

        {isPending ? (
          <Text size="sm" c="dimmed">
            AI screening has not been completed yet.
          </Text>
        ) : (
          <>
            <Group gap="lg" align="center">
              <RingProgress
                size={90}
                thickness={7}
                roundCaps
                sections={[{ value: aiScore, color }]}
                label={
                  <Text size="sm" fw={700} ta="center" c={color}>
                    {aiScore}%
                  </Text>
                }
              />
              {rec && (
                <Stack gap={4}>
                  <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
                    Recommendation
                  </Text>
                  <Badge color={rec.color} variant="light" size="md">
                    {rec.label}
                  </Badge>
                </Stack>
              )}
            </Group>

            {aiSummary && (
              <Text size="sm" c="dimmed">
                {aiSummary}
              </Text>
            )}
          </>
        )}

        {skills.length > 0 && (
          <Stack gap={6}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
              Extracted Skills
            </Text>
            <Group gap="xs">
              {skills.map((skill) => (
                <Badge key={skill} variant="outline" color="gray" size="sm">
                  {skill}
                </Badge>
              ))}
            </Group>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
