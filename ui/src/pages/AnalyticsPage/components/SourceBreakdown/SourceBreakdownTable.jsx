import "@mantine/core/styles.css";
import "mantine-react-table/styles.css";

import { useMemo, useState } from "react";
import { MRT_Table, useMantineReactTable } from "mantine-react-table";
import clsx from "clsx";
import styles from "./SourceBreakdownTable.module.css";
import { getSourceColor, formatSourceName } from "./helper";

export const SourceBreakdownTable = ({
  data = [],
  activeSource,
  onRowSelect,
}) => {
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "source",
        header: "Source",
        Cell: ({ cell }) => {
          const rawValue = cell.getValue();

          return (
            <span
              style={{
                color: getSourceColor(formatSourceName(rawValue)),
                fontWeight: 500,
              }}
            >
              {formatSourceName(rawValue)}
            </span>
          );
        },
      },
      { accessorKey: "total", header: "Total" },
      { accessorKey: "hired", header: "Hired" },
      {
        accessorKey: "conversionRate",
        header: "Conv.",
      },
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data,
    layoutMode: "semantic",

    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,

    enableSorting: true,
    enableSortingIndicators: false,
    enableMultiSort: false,
    enableColumnResizing: false,

    onSortingChange: setSorting,
    state: { sorting },

    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => onRowSelect?.(row.original.source),
      className: row.original.source === activeSource ? styles.activeRow : "",
    }),

    mantineTableHeadCellProps: {
      style: {
        textTransform: "uppercase",
        color: "#868e96",
        fontSize: "12px",
        padding: "12px 16px",
        width: "auto",
      },
    },

    mantineTableBodyCellProps: {
      style: {
        padding: "14px 16px",
        cursor: "pointer",
        width: "auto",
      },
    },

    mantineTableProps: {
      className: clsx(styles.table),
      highlightOnHover: false,
      withColumnBorders: true,
      withRowBorders: true,
      withTableBorder: true,
      style: { width: "100%", tableLayout: "fixed" },
    },

    mantineTableContainerProps: {
      style: {
        width: "100%",
        display: "block",
      },
    },
  });

  return (
    <div className={styles.tableWrapper}>
      <MRT_Table table={table} />
    </div>
  );
};
