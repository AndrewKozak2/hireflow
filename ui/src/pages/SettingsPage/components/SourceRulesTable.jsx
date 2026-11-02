import { useMemo } from "react";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";
import { ActionIcon, Badge, Button, Group } from "@mantine/core";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";

const MANTINE_COLORS = [
  "blue",
  "cyan",
  "grape",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "red",
  "teal",
  "violet",
  "yellow",
];

const getSourceColor = (label) => {
  if (!label) return "gray";

  const lowerLabel = label.toLowerCase();

  let hash = 0;
  for (let i = 0; i < lowerLabel.length; i++) {
    hash = lowerLabel.charCodeAt(i) + ((hash << 5) - hash);
  }

  return MANTINE_COLORS[Math.abs(hash) % MANTINE_COLORS.length];
};

export function SourceRulesTable({
  data = [],
  isLoading = false,
  onDeleteClick,
  onEditClick,
  onAddClick,
}) {
  const columns = useMemo(
    () => [
      {
        accessorKey: "sender_pattern",
        header: "SENDER PATTERN",
      },
      {
        accessorKey: "source_label",
        header: "SOURCE LABEL",
        Cell: ({ cell }) => {
          const label = cell.getValue();
          const color = getSourceColor(label);

          return (
            <Badge color={color} variant="light">
              {label}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "ACTIONS",
        size: 100,
        Cell: ({ row }) => (
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              color="blue"
              variant="subtle"
              onClick={() => onEditClick?.(row.original)}
              aria-label="Edit rule"
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              color="red"
              variant="subtle"
              onClick={() => onDeleteClick?.(row.original.id)}
              aria-label="Delete rule"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ),
      },
    ],
    [onDeleteClick, onEditClick],
  );

  const table = useMantineReactTable({
    columns,
    data,
    state: { isLoading },
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: false,
    enableGlobalFilter: false,
    enableHiding: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
  });

  return (
    <>
      <MantineReactTable table={table} />
      <Group mt="md">
        <Button
          size="xs"
          variant="outline"
          color="gray"
          leftSection={<IconPlus size={16} />}
          onClick={onAddClick}
        >
          Add rule
        </Button>
      </Group>
    </>
  );
}
