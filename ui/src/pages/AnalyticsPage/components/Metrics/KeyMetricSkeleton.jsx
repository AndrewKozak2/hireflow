import { Card, Skeleton } from "@mantine/core";

export function KeyMetricSkeleton() {
  return (
    <Card withBorder radius="md" p="18px 20px">
      <Skeleton h={14} w="50%" radius="sm" />
      <Skeleton h={34} w="34%" mt="md" radius="sm" />
      <Skeleton h={16} w="42%" mt="md" radius="sm" />
    </Card>
  );
}
