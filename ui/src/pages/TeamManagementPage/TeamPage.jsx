import { useEffect, useState, useCallback } from "react";
import { Card, Text, Tabs, Group, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAuth } from "../../hooks/useAuth";
import { notifications } from "@mantine/notifications";

import { TeamTable } from "./components/TeamTable";
import { UsersService } from "../../services/UsersService";

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("all");
  const navigate = useNavigate();
  const { revokeInvite } = useAuth();

  const me = useAuthStore((state) => state.user);

  const fetchUsers = useCallback(() => {
    Promise.all([UsersService.getUsers(), UsersService.getInvites()])
      .then(([fetchedUsers, fetchedInvites]) => {
        const activeAndDeactivated = (fetchedUsers || []).map((u) => {
          let determinedStatus = "active";

          if (u.status) {
            determinedStatus = u.status;
          } else if (u.isActive === false || u.is_active === false) {
            determinedStatus = "deactivated";
          }

          return {
            ...u,
            status: determinedStatus,
          };
        });

        const pendingInvites = (fetchedInvites || []).map((inv) => ({
          id: inv.id || `invite-${inv.email}`,
          name: "—",
          email: inv.email,
          role: inv.role,
          status: "pending",
          updated_at: inv.expires_at,
          isInvite: true,
        }));

        setUsers([...activeAndDeactivated, ...pendingInvites]);
      })
      .catch((err) => {
        console.error("Error fetching team data:", err);
        notifications.show({
          title: "Error",
          message: "Failed to fetch team data.",
          color: "red",
        });
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = Array.isArray(users)
    ? users.filter((u) => {
        const status = u.status;
        if (tab === "all") return true;
        return tab === status;
      })
    : [];

  const changeRole = async (id, role, currentRole) => {
    if (!role) return;

    if (role === currentRole) {
      notifications.show({
        title: "Role unchanged",
        message: "You selected the same role.",
        color: "gray",
      });
      return;
    }

    try {
      await UsersService.changeUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (error) {
      console.error("Failed to change user role:", error);
      notifications.show({
        title: "Error",
        message: "Failed to change user role.",
        color: "red",
      });
    }
  };

  const deactivate = async (id) => {
    try {
      await UsersService.deactivateUser(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "deactivated" } : u)),
      );
    } catch (error) {
      console.error("Failed to deactivate user:", error);
      notifications.show({
        title: "Error",
        message: "Failed to deactivate user.",
        color: "red",
      });
    }
  };

  const reactivate = async (id) => {
    try {
      await UsersService.reactivateUser(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "active" } : u)),
      );
    } catch (error) {
      console.error("Failed to reactivate user:", error);
      notifications.show({
        title: "Error",
        message: "Failed to reactivate user.",
        color: "red",
      });
    }
  };

  const resend = async (id) => {
    try {
      await UsersService.resendInvite(id);
      notifications.show({
        title: "Success",
        message: "Invite resent successfully.",
        color: "green",
      });
    } catch (error) {
      console.error("Failed to resend invite:", error);
      notifications.show({
        title: "Error",
        message: "Failed to resend invite.",
        color: "red",
      });
    }
  };

  const handleRevoke = async (email) => {
    try {
      await revokeInvite(email);
      setUsers((prev) => prev.filter((u) => u.email !== email));
    } catch (error) {
      console.error("Failed to revoke invite:", error);
      notifications.show({
        title: "Error",
        message: "Failed to revoke invite.",
        color: "red",
      });
    }
  };

  return (
    <>
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text size="xl" fw={600}>
            Team Management
          </Text>
          <Button onClick={() => navigate("/invite")}>Invite New User</Button>
        </Group>

        <Tabs value={tab} onChange={setTab} mb="md">
          <Tabs.List>
            <Tabs.Tab value="all">All</Tabs.Tab>
            <Tabs.Tab value="active">Active</Tabs.Tab>
            <Tabs.Tab value="pending">Pending invite</Tabs.Tab>
            <Tabs.Tab value="deactivated">Deactivated</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <TeamTable
          users={filteredUsers}
          changeRole={changeRole}
          deactivate={deactivate}
          reactivate={reactivate}
          resendInvite={resend}
          revokeInvite={handleRevoke}
          currentUserId={me?.id || me?.sub}
        />
      </Card>
    </>
  );
}
