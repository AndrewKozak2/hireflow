import { Box, Flex, Text } from "@mantine/core";
import { SearchInput } from "./SearchInput";

export function CandidatesListHeader({
  total,
  loading,
  inputValue,
  onSearchChange,
  onClear,
}) {
  return (
    <Flex justify="space-between" align="flex-start" mb="lg">
      <Box>
        {!loading && (
          <Text size="sm" c="dimmed" mt={4}>
            {total} {total === 1 ? "person" : "people"} in your candidate
            database
          </Text>
        )}
      </Box>
      <SearchInput
        value={inputValue}
        onChange={onSearchChange}
        onClear={onClear}
      />
    </Flex>
  );
}
