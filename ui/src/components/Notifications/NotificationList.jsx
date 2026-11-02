import {
  Box,
  Button,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconBellOff } from "@tabler/icons-react";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { NotificationItem } from "./NotificationItem";

const SKELETON_COUNT = 3;

export const NotificationList = ({ onClose }) => {
  const { notifications, isLoading, markAllAsRead, clearAll } =
    useNotificationStore();

  const allRead =
    notifications.length > 0 && notifications.every((n) => n.is_read);

  const handleClearAll = () => {
    modals.openConfirmModal({
      title: "Clear all notifications",
      children: (
        <Text size="sm">
          Are you sure you want to remove all notifications? This cannot be
          undone.
        </Text>
      ),
      labels: { confirm: "Clear all", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: clearAll,
    });
  };

  return (
    <Box w={360}>
      {/* Header */}
      <Group
        justify="space-between"
        px="md"
        py="xs"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
      >
        <Text fw={600} size="sm">
          Notifications
        </Text>
        <Group gap={4}>
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={markAllAsRead}
            disabled={allRead || notifications.length === 0}
          >
            Mark all as read
          </Button>
          <Button
            variant="subtle"
            color="red"
            size="compact-xs"
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            Clear all
          </Button>
        </Group>
      </Group>

      {/* Body */}
      <ScrollArea h={400} scrollbarSize={4}>
        {isLoading ? (
          <Stack gap={0}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <Group
                key={i}
                wrap="nowrap"
                align="flex-start"
                gap="sm"
                px="md"
                py="sm"
                style={{
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Skeleton circle h={28} w={28} />
                <Stack gap={6} style={{ flex: 1 }}>
                  <Skeleton h={11} w="55%" radius="sm" />
                  <Skeleton h={9} w="85%" radius="sm" />
                  <Skeleton h={9} w="40%" radius="sm" />
                </Stack>
              </Group>
            ))}
          </Stack>
        ) : notifications.length === 0 ? (
          <Stack align="center" justify="center" h={200} gap="xs" c="dimmed">
            <IconBellOff size={32} stroke={1.2} />
            <Text size="sm">No notifications</Text>
          </Stack>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClose={onClose} />
          ))
        )}
      </ScrollArea>
    </Box>
  );
};
