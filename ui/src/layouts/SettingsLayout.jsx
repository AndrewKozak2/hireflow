import { Box, Flex, Stack, Text, NavLink } from "@mantine/core";
import {
  NavLink as RouterNavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import { ROUTES } from "../routes/routes";

const SettingsLayout = () => {
  const location = useLocation();

  return (
    <Box>
      <Box mb="xl">
        <Text c="dimmed" size="sm">
          Manage your team, integrations, and email settings.
        </Text>
      </Box>

      <Flex gap="xl" mt="md" direction={{ base: "column", md: "row" }}>
        <Box w={{ base: "100%", md: 200 }} style={{ flexShrink: 0 }}>
          <Stack gap="xs">
            <NavLink
              component={RouterNavLink}
              to={ROUTES.SETTING_TEAM}
              label="Team"
              active={location.pathname.startsWith(ROUTES.SETTING_TEAM)}
              radius="sm"
            />
            <NavLink
              component={RouterNavLink}
              to={ROUTES.SETTING_EMAIL}
              label="Email Settings"
              active={location.pathname.startsWith(ROUTES.SETTING_EMAIL)}
              radius="sm"
            />
          </Stack>
        </Box>

        <Box flex={1} style={{ maxWidth: "1000px" }}>
          <Outlet />
        </Box>
      </Flex>
    </Box>
  );
};

export default SettingsLayout;
