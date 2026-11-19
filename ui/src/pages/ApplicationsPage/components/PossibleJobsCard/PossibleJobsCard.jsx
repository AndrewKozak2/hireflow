import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBriefcase, IconSparkles } from "@tabler/icons-react";
import { useJobSuggestions } from "../../../../hooks/useJobSuggestions";
import { assignJobAndRunScreening } from "../../utils/assignJobAndRunScreening";
import { optionBadge, suggestionReason } from "../../utils/jobSuggestions";

/**
 * For an emailed application left without a job: the jobs the email could
 * mean, or AI suggestions from the CV, each assignable in one click. Assigning
 * runs AI screening for that job, like "Assign job" in the applications table.
 */
export function PossibleJobsCard({ application, onRefresh }) {
  const isUnassigned = Boolean(application?.id) && !application?.jobId;
  const suggestions = useJobSuggestions(isUnassigned ? [application.id] : []);
  const suggestion = isUnassigned ? suggestions[application.id] : null;
  const [assigningJobId, setAssigningJobId] = useState(null);

  if (!suggestion || suggestion.options.length === 0) return null;

  const fromEmail = suggestion.status === "ambiguous";

  const handleAssign = async (jobId) => {
    setAssigningJobId(jobId);
    try {
      const { screening } = await assignJobAndRunScreening(
        application.id,
        jobId,
      );
      onRefresh?.();
      screening.then((screened) => {
        if (!screened) {
          notifications.show({
            color: "yellow",
            title: "AI screening failed",
            message:
              "The job is assigned, but AI screening could not run for this candidate.",
          });
        }
        onRefresh?.();
      });
    } catch (error) {
      console.error("Failed to assign job to application:", error);
      notifications.show({
        color: "red",
        title: "Couldn't assign the job",
        message: "Try again in a moment.",
      });
    } finally {
      setAssigningJobId(null);
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Group gap="xs">
          <ThemeIcon
            color={fromEmail ? "blue" : "violet"}
            variant="light"
            size="sm"
            radius="sm"
          >
            {fromEmail ? (
              <IconBriefcase size={12} />
            ) : (
              <IconSparkles size={12} />
            )}
          </ThemeIcon>
          <Text fw={600} size="sm">
            Possible jobs
          </Text>
        </Group>

        <Text size="sm" c="dimmed">
          {suggestionReason(suggestion)}
        </Text>

        <Stack gap="xs">
          {suggestion.options.map((option) => (
            <Card key={option.jobId} withBorder radius="sm" p="xs" px="sm">
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={500} truncate>
                      {option.title}
                    </Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color={option.source === "email" ? "blue" : "violet"}
                      style={{ flexShrink: 0 }}
                    >
                      {optionBadge(option)}
                    </Badge>
                  </Group>
                  {option.reason && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {option.reason}
                    </Text>
                  )}
                </Stack>
                <Button
                  size="xs"
                  variant="light"
                  // Long AI reasons must never squeeze the button
                  style={{ flexShrink: 0 }}
                  loading={assigningJobId === option.jobId}
                  disabled={
                    assigningJobId !== null && assigningJobId !== option.jobId
                  }
                  onClick={() => handleAssign(option.jobId)}
                >
                  Assign
                </Button>
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
