import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Card,
  Center,
  SimpleGrid,
  Skeleton,
  Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { AnalyticsService } from "../../../../services/AnalyticsService";
import { RecruitmentCostMetrics } from "../RecruitmentCostMetrics/RecruitmentCostMetrics";
import { CostBreakdownSection } from "../RecruitmentCostBreakdowns/CostBreakdownSection/CostBreakdownSection";

const formatBreakdownLabel = (value) =>
  String(value || "Other")
    .split("_")
    .map((part) => {
      const lowerPart = part.toLowerCase();
      return lowerPart.charAt(0).toUpperCase() + lowerPart.slice(1);
    })
    .join(" ");

export function RecruitmentCosts({ from, to }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recruitmentCosts", from, to],
    queryFn: () => AnalyticsService.getRecruitmentCosts({ from, to }),
  });

  if (isLoading) {
    return <RecruitmentCostsSkeleton />;
  }

  if (isError) {
    return (
      <Box mt="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="red"
          variant="light"
          radius="md"
        >
          Failed to load recruitment cost data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const isEmpty =
    !data ||
    (data.totalCost == null &&
      !data.byCategory?.length &&
      !data.bySource?.length);

  if (isEmpty) {
    return (
      <Box mt="xl">
        <Card withBorder radius="md" p="lg">
          <Center py="xl">
            <Text c="dimmed">No recruitment cost data for this period</Text>
          </Center>
        </Card>
      </Box>
    );
  }

  const categoryItems = (data.byCategory ?? []).map((item) => ({
    label: formatBreakdownLabel(item.category),
    value: item.totalCost,
  }));
  const sourceItems = (data.bySource ?? [])
    .filter((item) => item.source)
    .map((item) => ({
      label: formatBreakdownLabel(item.source),
      value: item.totalCost,
    }));

  return (
    <Box mt="xl">
      <RecruitmentCostMetrics
        totalCost={data.totalCost}
        averageCostToHire={data.averageCostToHire}
        hiredCount={data.hiredCount}
        currency={data.currency}
      />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
        <CostBreakdownSection
          title="Cost by Category"
          items={categoryItems}
          currency={data.currency}
        />
        <CostBreakdownSection
          title="Cost by Source"
          items={sourceItems}
          currency={data.currency}
        />
      </SimpleGrid>
    </Box>
  );
}

function RecruitmentCostsSkeleton() {
  return (
    <Box mt="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i} withBorder radius="md" p="18px 20px">
            <Skeleton h={14} w="55%" radius="sm" />
            <Skeleton h={34} w="40%" mt={10} radius="sm" />
          </Card>
        ))}
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i} withBorder radius="md" p="lg">
            <Skeleton h={15} w="45%" radius="sm" mb="md" />
            {Array.from({ length: 3 }, (_, j) => (
              <Skeleton key={j} h={20} radius="sm" mt="sm" />
            ))}
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}
