import {
  Card,
  Center,
  Group,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { formatCurrency } from "../../../../../utils/formatters";

export function CostBreakdownSection({ title, items = [], currency = "USD" }) {
  const theme = useMantineTheme();

  return (
    <Card withBorder radius="md" p="lg">
      <Title order={3} fz={15} mb={15} c={theme.colors.gray[9]}>
        {title}
      </Title>
      {items.length === 0 ? (
        <Center py="md">
          <Text size="sm" c="dimmed">
            No data for this period
          </Text>
        </Center>
      ) : (
        items.map((item, i) => (
          <Group
            key={`${item.label}-${i}`}
            justify="space-between"
            py={10}
            style={{ borderBottom: `1px solid ${theme.colors.gray[2]}` }}
          >
            <Text size="sm" c={theme.colors.gray[8]}>
              {item.label}
            </Text>
            <Text size="sm" fw={600} c={theme.colors.gray[9]} ff="monospace">
              {formatCurrency(item.value, currency)}
            </Text>
          </Group>
        ))
      )}
    </Card>
  );
}
