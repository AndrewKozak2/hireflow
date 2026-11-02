import {
  Stack,
  NavLink,
  Box,
  Title,
  Group,
  Text,
  Avatar,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useNavigate, useLocation } from "react-router-dom";
import { IconLogout } from "@tabler/icons-react";
import { NAVIGATION_LINKS } from "../../constants/navigation";
import { hasAccess } from "../../utils/authUtils";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAuth } from "../../hooks/useAuth";
import classes from "./Navbar.module.css";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const { logout } = useAuth();

  const accessibleLinks = NAVIGATION_LINKS.filter((link) =>
    hasAccess(userRole, link.allowedRoles),
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navClassNames = {
    root: classes.navRoot,
    label: classes.navLabel,
    section: classes.navSection,
  };

  return (
    <Box className={classes.wrapper}>
      <Group
        className={classes.logoGroup}
        gap="md"
        wrap="nowrap"
        onClick={() => navigate("/dashboard")}
      >
        <Box className={classes.logoIcon}>HF</Box>
        <Title className={classes.brandTitle}>HireFlow</Title>
      </Group>
      <Stack gap={4} className={classes.navStack}>
        {accessibleLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path);

          return (
            <NavLink
              key={link.path}
              label={link.label}
              leftSection={<link.icon size={20} stroke={isActive ? 2 : 1.5} />}
              rightSection={
                link.badge ? (
                  <Box className={classes.badge}>{link.badge}</Box>
                ) : null
              }
              active={isActive}
              onClick={() => navigate(link.path)}
              variant="light"
              classNames={navClassNames}
            />
          );
        })}
      </Stack>

      <Box className={classes.userFooter}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Avatar
              src={null}
              alt={user?.name}
              color="indigo"
              radius="xl"
              size="md"
            >
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </Avatar>

            <Box style={{ flex: 1, overflow: "hidden" }}>
              <Text size="sm" fw={600} className={classes.userName} truncate>
                {user?.name || "User Name"}
              </Text>
              <Text size="xs" c="dimmed" className={classes.userRole} truncate>
                {user?.role?.replace("_", " ") || "Role"}
              </Text>
            </Box>
          </Group>

          <Tooltip label="Вийти" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={handleLogout}
              className={classes.logoutAction}
            >
              <IconLogout size={22} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>
    </Box>
  );
}
