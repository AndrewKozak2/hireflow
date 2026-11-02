import { Group, Radio, Stack, Text } from "@mantine/core";

export function RadioCardList({ data, value, onChange, error, disabled }) {
  return (
    <Radio.Group value={value} onChange={onChange} error={error}>
      <Stack gap="xs">
        {data.map((item) => (
          <Radio.Card
            key={item.value}
            value={item.value}
            withBorder
            p="sm"
            radius="sm"
            disabled={disabled}
          >
            <Group wrap="nowrap" align="flex-start">
              <Radio.Indicator mt={3} disabled={disabled} />
              <Stack gap={2}>
                <Text size="sm" fw={600}>
                  {item.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.description}
                </Text>
              </Stack>
            </Group>
          </Radio.Card>
        ))}
      </Stack>
    </Radio.Group>
  );
}
