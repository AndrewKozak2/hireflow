import { ActionIcon, TextInput } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";

export function SearchInput({ value, onChange, onClear }) {
  return (
    <TextInput
      placeholder="Search by name, email, or skill..."
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      leftSection={<IconSearch size={16} />}
      rightSection={
        value ? (
          <ActionIcon
            variant="transparent"
            color="gray"
            onClick={onClear}
            aria-label="Clear search"
          >
            <IconX size={16} />
          </ActionIcon>
        ) : null
      }
      w={320}
    />
  );
}
