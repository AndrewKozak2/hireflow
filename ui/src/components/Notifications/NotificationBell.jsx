import { ActionIcon, Indicator, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBell } from "@tabler/icons-react";
import {
  useNotificationStore,
  selectUnreadCount,
} from "../../stores/useNotificationStore";
import { NotificationList } from "./NotificationList";

export const NotificationBell = () => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const unreadCount = useNotificationStore(selectUnreadCount);

  return (
    <Popover
      opened={opened}
      onClose={close}
      position="bottom-end"
      shadow="md"
      withArrow
      arrowPosition="side"
      offset={8}
    >
      <Popover.Target>
        <Indicator
          label={unreadCount > 9 ? "9+" : unreadCount}
          size={18}
          disabled={unreadCount === 0}
          color="red"
          offset={4}
          inline
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            size="lg"
            onClick={toggle}
            aria-label="Notifications"
          >
            <IconBell size={20} stroke={1.5} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown style={{ padding: 0, overflow: "hidden" }}>
        <NotificationList onClose={close} />
      </Popover.Dropdown>
    </Popover>
  );
};
