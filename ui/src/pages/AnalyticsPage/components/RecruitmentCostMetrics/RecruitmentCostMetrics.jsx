import { Card, SimpleGrid, Text, Title, useMantineTheme } from "@mantine/core";
import { formatCurrency } from "../../../../utils/formatters";

export function RecruitmentCostMetrics({
  totalCost,
  averageCostToHire,
  hiredCount,
  currency,
}) {
  const theme = useMantineTheme();

  const cards = [
    {
      key: "totalCost",
      label: "Total Recruitment Cost",
      value: formatCurrency(totalCost, currency),
      emptyMessage: null,
    },
    {
      key: "avgCost",
      label: "Average Cost to Hire",
      value:
        hiredCount > 0 ? formatCurrency(averageCostToHire, currency) : null,
      emptyMessage: "No hired candidates for this period",
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {cards.map((card) => (
        <Card key={card.key} withBorder radius="md" p="18px 20px">
          <Text
            tt="uppercase"
            fz={12}
            fw={600}
            c={theme.colors.gray[6]}
            lts={0.9}
          >
            {card.label}
          </Text>
          {card.value !== null ? (
            <Title
              order={2}
              mt={10}
              fz={28}
              fw={700}
              lh={1.1}
              c={theme.colors.gray[9]}
            >
              {card.value}
            </Title>
          ) : (
            <Text mt={10} fz={14} c="dimmed">
              {card.emptyMessage}
            </Text>
          )}
        </Card>
      ))}
    </SimpleGrid>
  );
}
