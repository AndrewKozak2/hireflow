import { useState } from "react";
import {
  Card,
  Stack,
  Text,
  Button,
  Group,
  Rating,
  Badge,
  Grid,
} from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { ApplicationsService } from "../../../../services/ApplicationsService";
import { notifications } from "@mantine/notifications";

export function ScoreCardPreview({
  application,
  scoreCard,
  onScoreCardGenerated,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isTechnicalStagePassed = [
    "technical_interview",
    "offer",
    "hired",
    "rejected",
  ].includes(application?.stage?.toLowerCase());

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await ApplicationsService.generateAiScoreCard(
        application.id,
      );

      notifications.show({
        title: "Success",
        message: "AI Score Card generated successfully!",
        color: "teal",
      });

      if (onScoreCardGenerated) {
        onScoreCardGenerated(response.data);
      }
    } catch (error) {
      notifications.show({
        title: "Generation Failed",
        message:
          error.response?.data?.message || "Could not generate score card",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="left">
          <Text fw={700} size="md">
            Score Card
          </Text>
          {scoreCard && (
            <Badge color="green" variant="light">
              SUBMITTED
            </Badge>
          )}
        </Group>

        {!scoreCard ? (
          <Stack gap={10} align="center" py="lg">
            <Text size="sm" fw={500} ta="center">
              Score card has not been submitted yet.
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Gather interview comments and let AI generate the final score.
            </Text>
            <Button
              mt="md"
              leftSection={<IconSparkles size={16} />}
              variant="light"
              color="indigo"
              loading={isLoading}
              disabled={!isTechnicalStagePassed}
              onClick={handleGenerate}
            >
              AI Generate
            </Button>
            {!isTechnicalStagePassed && (
              <Text size="xs" c="red" ta="center">
                Candidate must pass Technical Interview first.
              </Text>
            )}
          </Stack>
        ) : (
          <Stack gap="xl" mt="sm">
            <Grid gutter="xl">
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed" fw={600} mb={4} tt="uppercase">
                  Technical Skills
                </Text>
                <Rating
                  value={scoreCard.technicalSkillsScore}
                  readOnly
                  color="yellow"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed" fw={600} mb={4} tt="uppercase">
                  Problem Solving
                </Text>
                <Rating
                  value={scoreCard.problemSolvingScore}
                  readOnly
                  color="yellow"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed" fw={600} mb={4} tt="uppercase">
                  Communication
                </Text>
                <Rating
                  value={scoreCard.communicationScore}
                  readOnly
                  color="yellow"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed" fw={600} mb={4} tt="uppercase">
                  Team Fit
                </Text>
                <Rating
                  value={scoreCard.teamFitScore}
                  readOnly
                  color="yellow"
                />
              </Grid.Col>
            </Grid>

            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Overall Comment
              </Text>
              <Text size="sm">{scoreCard.comment}</Text>
            </Stack>

            <Group gap="xs">
              <Badge
                color={
                  scoreCard.recommendation === "proceed"
                    ? "green"
                    : scoreCard.recommendation === "reject"
                      ? "red"
                      : "orange"
                }
                variant="light"
              >
                {scoreCard.recommendation.toUpperCase()}
              </Badge>
              {scoreCard.interviewer && (
                <Text size="xs" c="dimmed">
                  by {scoreCard.interviewer.name}
                </Text>
              )}
            </Group>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
