import { Badge } from "@mantine/core";
import { JOB_STATUS_CONFIG } from "../../../constants/job";

export function StatusBadge({ status }) {
  const config = JOB_STATUS_CONFIG[status] || { color: "gray", label: status };
  return (
    <Badge color={config.color} variant="light">
      {config.label}
    </Badge>
  );
}
