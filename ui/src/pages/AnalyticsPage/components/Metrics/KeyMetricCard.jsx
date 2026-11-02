import { useState } from "react";
import { Card, Group, Text, Title, useMantineTheme } from "@mantine/core";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";

export function KeyMetricCard({ metric }) {
  const theme = useMantineTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isNew = metric.trend === "New";
  const isTrendDown = typeof metric.trend === "number" && metric.trend < 0;
  const TrendIcon = isTrendDown ? IconArrowDown : IconArrowUp;
  const isPositiveTrend =
    metric.positiveDirection === (isTrendDown ? "down" : "up");
  const trendColor =
    isPositiveTrend || isNew ? theme.colors.success[7] : theme.colors.danger[7];

  return (
    <Card
      withBorder
      radius="md"
      p="18px 20px"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered ? theme.colors.gray[3] : undefined,
        boxShadow: isHovered ? theme.shadows.sm : undefined,
        transition: "border-color 100ms ease, box-shadow 100ms ease",
      }}
    >
      <Text tt="uppercase" fz={12} fw={600} c={theme.colors.gray[6]} lts={0.9}>
        {metric.label}
      </Text>

      <Title
        order={2}
        mt={10}
        fz={28}
        fw={700}
        lh={1.1}
        c={theme.colors.gray[9]}
      >
        {metric.value}
      </Title>

      {metric.trendLabel ? (
        <Group gap={5} mt={10} c={trendColor}>
          {!isNew ? <TrendIcon size={16} stroke={1.8} /> : null}
          <Text size="sm" fw={500}>
            {metric.trendLabel}
          </Text>
        </Group>
      ) : null}
    </Card>
  );
}
