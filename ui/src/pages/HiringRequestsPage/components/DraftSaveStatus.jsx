import { Text } from "@mantine/core";

export function DraftSaveStatus({ status, lastSavedAt }) {
  if (!status || status === "idle") return null;

  const label = {
    saving: "Saving...",
    saved: lastSavedAt
      ? `Saved at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "Saved",
    error: "Failed to save",
  }[status];

  return (
    <Text
      size="xs"
      c={status === "error" ? "red" : "dimmed"}
      style={{ minWidth: 110 }}
    >
      {label}
    </Text>
  );
}
