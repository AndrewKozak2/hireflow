import { Group, Title, Box, Burger } from "@mantine/core";
import { useLocation } from "react-router-dom";
import { NAVIGATION_LINKS } from "../../constants/navigation";
import { NotificationBell } from "../Notifications/NotificationBell";
import classes from "./Header.module.css";

export function Header({ opened, toggle }) {
  const location = useLocation();

  const activeLink = [...NAVIGATION_LINKS]
    .sort((a, b) => b.path.length - a.path.length)
    .find((link) => location.pathname.startsWith(link.path));

  const pageTitle = activeLink ? activeLink.label : "Dashboard";

  return (
    <Group h="100%" justify="space-between" wrap="nowrap">
      <Group gap="lg">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Title order={2} className={classes.pageTitle}>
          {pageTitle}
        </Title>
      </Group>

      <Box className={classes.rightSection}>
        <NotificationBell />
      </Box>
    </Group>
  );
}
