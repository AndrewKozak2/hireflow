import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Center,
  Flex,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { AnalyticsService } from "../../../../services/AnalyticsService";
import { RecruitmentFunnelSkeleton } from "./RecruitmentFunnelSkeleton";

const MIN_VISIBLE_BAR_WIDTH = 30;

function getStageLabel(stage) {
  if (stage === "Technical Interview") {
    return "Technical";
  }

  return stage;
}

function buildFunnelViewModel(data) {
  const pipelineStages = data.filter((stage) => stage.stage !== "New");
  const maxCount = Math.max(...pipelineStages.map((stage) => stage.count), 0);

  return pipelineStages.map((stage) => {
    const count = stage.count;
    const proportionalWidth =
      maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

    return {
      stage: stage.stage,
      label: getStageLabel(stage.stage),
      count,
      averageDays: stage.avgDays,
      width: count > 0 ? Math.max(proportionalWidth, 8) : 0,
    };
  });
}

export function RecruitmentFunnel({ from, to }) {
  const theme = useMantineTheme();
  const [funnelData, setFunnelData] = useState(null);
  const [hoveredStage, setHoveredStage] = useState(null);

  useEffect(() => {
    let ignore = false;

    AnalyticsService.getFunnel({ from, to })
      .then((data) => {
        if (ignore) {
          return;
        }

        setFunnelData(data);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setFunnelData([]);
      });

    return () => {
      ignore = true;
    };
  }, [from, to]);

  const stages = funnelData ? buildFunnelViewModel(funnelData) : [];
  const hasData = stages.some((stage) => stage.count > 0);
  const activeGradient = `linear-gradient(90deg, ${theme.colors.indigo[6]}, ${theme.colors.violetAccent[6]})`;

  if (!funnelData) {
    return <RecruitmentFunnelSkeleton />;
  }

  return (
    <Card
      withBorder
      radius="md"
      p="lg"
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Title order={3} fz={15} mb={15} c={theme.colors.gray[9]}>
        Recruitment funnel
      </Title>

      {!hasData ? (
        <Center py="xl">
          <Text c={theme.colors.gray[6]}>
            No application data for this period
          </Text>
        </Center>
      ) : (
        <Box style={{ flex: 1 }}>
          <Stack gap={4} h="100%" justify="space-between">
            {stages.map((stage) => {
              const isHovered = hoveredStage === stage.stage;
              const barWidth =
                stage.width === 0 ? MIN_VISIBLE_BAR_WIDTH : `${stage.width}%`;

              return (
                <Flex key={stage.stage} py={6} align="center" gap="xl">
                  <Text
                    size="sm"
                    fw={500}
                    miw={140}
                    c={theme.colors.gray[9]}
                    style={{ flexShrink: 0 }}
                  >
                    {stage.label}
                  </Text>

                  <Box
                    style={{
                      flex: 1,
                      minWidth: MIN_VISIBLE_BAR_WIDTH,
                    }}
                  >
                    <Tooltip
                      withArrow
                      transitionProps={{ transition: "fade", duration: 120 }}
                      label={
                        <Stack gap={2}>
                          <Text size="xs" c={theme.white}>
                            {stage.count} applications
                          </Text>
                          <Text size="xs" c={theme.white}>
                            Avg {stage.averageDays.toFixed(1)} days at this
                            stage
                          </Text>
                        </Stack>
                      }
                    >
                      <Paper
                        radius="xs"
                        px="sm"
                        h={28}
                        display="flex"
                        c={
                          stage.count === 0 ? theme.colors.gray[6] : theme.white
                        }
                        bg={
                          stage.count === 0 ? theme.colors.gray[1] : undefined
                        }
                        w={barWidth}
                        miw={MIN_VISIBLE_BAR_WIDTH}
                        onMouseEnter={() => setHoveredStage(stage.stage)}
                        onMouseLeave={() => setHoveredStage(null)}
                        style={{
                          alignItems: "center",
                          background:
                            stage.count > 0 ? activeGradient : undefined,
                          boxShadow: isHovered ? theme.shadows.sm : undefined,
                          transform: isHovered ? "translateY(-1px)" : undefined,
                          transition:
                            "width 160ms ease, box-shadow 120ms ease, transform 120ms ease",
                        }}
                      >
                        <Text size="xs" fw={600}>
                          {stage.count}
                        </Text>
                      </Paper>
                    </Tooltip>
                  </Box>

                  <Text
                    size="sm"
                    c={theme.colors.gray[7]}
                    ff="monospace"
                    w={38}
                    ta="left"
                    style={{ flexShrink: 0 }}
                  >
                    {stage.count}
                  </Text>
                </Flex>
              );
            })}
          </Stack>
        </Box>
      )}
    </Card>
  );
}
