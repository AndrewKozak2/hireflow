import {
  Table,
  Select,
  Badge,
  Button,
  Group,
  Text,
  Avatar,
  Stack,
} from "@mantine/core";
import { useDateTime } from "../../../hooks/useDateTime";

export function TeamTable({
  users,
  changeRole,
  deactivate,
  reactivate,
  resendInvite,
  revokeInvite,
  currentUserId,
}) {
  const formatRoleLabel = (roleValue) => {
    const roles = {
      admin: "Admin",
      hiring_manager: "Hiring Manager",
      recruiter: "Recruiter",
    };
    return roles[roleValue] || roleValue;
  };

  const { formatDate } = useDateTime();

  return (
    <Table
      verticalSpacing="sm"
      horizontalSpacing="md"
      highlightOnHover
      withTableBorder
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th>MEMBER</Table.Th>
          <Table.Th>ROLE</Table.Th>
          <Table.Th>STATUS</Table.Th>
          <Table.Th>LAST ACTIVE</Table.Th>
          <Table.Th ta="right">ACTIONS</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {users.map((user) => {
          const isPending = user.status === "pending";
          const isDeactivated = user.status === "deactivated";
          const isActive = user.status === "active";

          return (
            <Table.Tr key={user.id}>
              <Table.Td>
                <Group gap="sm" wrap="nowrap">
                  <Avatar radius="xl" color="initials" name={user.name} />
                  <Stack gap={2}>
                    <Text
                      size="sm"
                      fw={600}
                      c={isDeactivated ? "dimmed" : "inherit"}
                    >
                      {user.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user.email}
                    </Text>
                  </Stack>
                </Group>
              </Table.Td>

              <Table.Td style={{ width: "200px" }}>
                {isActive && user.id !== currentUserId ? (
                  <Select
                    size="xs"
                    value={user.role}
                    data={[
                      { value: "hiring_manager", label: "Hiring Manager" },
                      { value: "recruiter", label: "Recruiter" },
                    ]}
                    allowDeselect={false}
                    onOptionSubmit={(val) =>
                      changeRole(user.id, val, user.role)
                    }
                  />
                ) : (
                  <Text size="sm" c="dimmed">
                    {formatRoleLabel(user.role)}
                  </Text>
                )}
              </Table.Td>

              <Table.Td>
                <Badge
                  variant="light"
                  color={isActive ? "green" : isPending ? "orange" : "gray"}
                >
                  {isPending ? "Pending Invite" : user.status}
                </Badge>
              </Table.Td>

              {/* LAST ACTIVE COLUMN */}
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {user.updated_at ? formatDate(user.updated_at) : "Never"}
                </Text>
              </Table.Td>

              {/* ACTIONS COLUMN */}
              <Table.Td>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  {isPending && (
                    <>
                      <Button
                        size="xs"
                        variant="outline"
                        color="gray"
                        onClick={() => resendInvite(user.id)}
                      >
                        Resend
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        color="gray"
                        onClick={() => revokeInvite(user.email)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}

                  {isActive && user.id !== currentUserId && (
                    <Button
                      size="xs"
                      variant="outline"
                      color="gray"
                      onClick={() => deactivate(user.id)}
                    >
                      Deactivate
                    </Button>
                  )}

                  {!isActive && !isPending && user.id !== currentUserId && (
                    <Button
                      size="xs"
                      variant="outline"
                      color="gray"
                      onClick={() => reactivate(user.id)}
                    >
                      Reactivate
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
