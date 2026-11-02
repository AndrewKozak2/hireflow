import { Badge, useMantineTheme } from "@mantine/core";
import { HIRING_REQUEST_STATUS_META } from "../../../constants/hiringRequestConstants";

export function HiringRequestStatusBadge({ status }) {
  const theme = useMantineTheme();
  const meta = HIRING_REQUEST_STATUS_META[status] ?? {
    label: status,
    color: "gray",
  };

  const colorStyles = {
    yellow: {
      backgroundColor: theme.colors.warning[1],
      color: theme.other.appColors.warning,
    },
    blue: {
      backgroundColor: theme.colors.blue[1],
      color: theme.other.appColors.blue,
    },
    green: {
      backgroundColor: theme.colors.success[1],
      color: theme.other.appColors.success,
    },
    red: {
      backgroundColor: theme.colors.red[1],
      color: theme.colors.red[6],
    },
    gray: {
      backgroundColor: theme.colors.gray[1],
      color: theme.colors.gray[6],
    },
  };

  return (
    <Badge
      radius="lg"
      tt="uppercase"
      fw={600}
      styles={{
        root: {
          ...colorStyles[meta.color],
          border: "none",
          letterSpacing: "0.04em",
          padding: "2px 8px",
          height: "1.75rem",
        },
        label: {
          overflow: "visible",
        },
      }}
    >
      {meta.label}
    </Badge>
  );
}
