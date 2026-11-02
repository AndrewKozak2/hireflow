import { Card, SimpleGrid, Text } from "@mantine/core";

export function StatsGrid({ data, isManager, isAdmin }) {
  if (!data || !Array.isArray(data)) {
    console.warn("StatsGrid: data is not an array", data);
    return null;
  }

  const columns = isManager
    ? { base: 1, sm: 1, md: 2 }
    : isAdmin
      ? { base: 1, sm: 2, md: 3 }
      : { base: 1, sm: 2, md: 4 };

  return (
    <SimpleGrid cols={columns} spacing="md">
      {data.map((stat, idx) => (
        <Card
          key={idx}
          withBorder
          radius="md"
          padding="lg"
          onClick={stat.onClick}
          style={{ cursor: stat.onClick ? "pointer" : "default" }}
        >
          <Text size="xs" fw={700} c="dimmed" lts="0.5px">
            {stat?.title}
          </Text>
          <Text size="xl" fw={700} my={4} style={{ fontSize: "28px" }}>
            {stat?.value}
          </Text>
          <Text
            size="xs"
            c={stat?.color === "green" ? "green.6" : "red.6"}
            fw={500}
          >
            {stat?.desc}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
