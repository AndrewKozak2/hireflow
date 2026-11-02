import { Group, Stack, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/routes";
import { useNotificationStore } from "../../stores/useNotificationStore";

const TYPE_CONFIG = {
  INFO: { icon: IconInfoCircle, color: "blue" },
  SUCCESS: { icon: IconCircleCheck, color: "green" },
  WARNING: { icon: IconAlertTriangle, color: "yellow" },
  ERROR: { icon: IconCircleX, color: "red" },
};

const getRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NotificationItem = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  const { id, type, title, message, is_read, created_at, metadata } =
    notification;

  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.INFO;
  const Icon = config.icon;

  const handleClick = () => {
    const wasUnread = !is_read;
    if (wasUnread) markAsRead(id);
    onClose?.();
    if (metadata?.jobId) {
      navigate(ROUTES.JOB_DETAIL.replace(":id", metadata.jobId));
    } else if (metadata?.hiringRequestId) {
      navigate(
        ROUTES.HIRING_REQUEST_DETAIL.replace(":id", metadata.hiringRequestId),
      );
    } else if (metadata?.applicationId) {
      navigate(
        ROUTES.APPLICATION_DETAIL.replace(":id", metadata.applicationId),
      );
    }
  };

  return (
    <UnstyledButton
      onClick={handleClick}
      style={{
        display: "block",
        width: "100%",
        padding: "12px 16px",
        borderBottom: "1px solid var(--mantine-color-gray-2)",
        backgroundColor: is_read
          ? "transparent"
          : "var(--mantine-color-indigo-0)",
        cursor: "pointer",
        transition: "background-color 120ms ease",
      }}
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <ThemeIcon variant="light" color={config.color} size="md" radius="xl">
          <Icon size={14} />
        </ThemeIcon>

        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Text size="sm" fw={is_read ? 400 : 600} truncate>
              {title}
            </Text>
            <Text
              size="xs"
              c="dimmed"
              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {getRelativeTime(created_at)}
            </Text>
          </Group>

          <Text size="xs" c="dimmed" lineClamp={2}>
            {message}
          </Text>
        </Stack>
      </Group>
    </UnstyledButton>
  );
};
