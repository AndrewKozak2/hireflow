import React, { useState } from "react";
import {
  Table,
  Text,
  Badge,
  Anchor,
  TextInput,
  Stack,
  Button,
  Loader,
  Center,
} from "@mantine/core";
import { useNavigate, Link } from "react-router-dom";
import { IconSearch } from "@tabler/icons-react";
import { ROUTES } from "../../../routes/routes";

export function ApplicationsList({ applications = [], isLoading }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = applications.filter((app) => {
    const fullName =
      `${app.candidate?.firstName || ""} ${app.candidate?.lastName || ""}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  if (isLoading)
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Search candidates..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Candidate</Table.Th>
            <Table.Th>Stage</Table.Th>
            <Table.Th>AI Score</Table.Th>
            <Table.Th>Applied Date</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.map((app) => (
            <Table.Tr key={app.id}>
              <Table.Td>
                <Anchor
                  onClick={() =>
                    navigate(
                      `/candidates/${app.candidateId || app.candidate?.id}`,
                    )
                  }
                >
                  <Text fw={500}>
                    {app.candidate?.firstName} {app.candidate?.lastName}
                  </Text>
                </Anchor>
              </Table.Td>
              <Table.Td>
                <Badge variant="light">{app.stage}</Badge>
              </Table.Td>
              <Table.Td>
                <Badge color={app.aiScore >= 70 ? "green" : "orange"}>
                  {app.aiScore}%
                </Badge>
              </Table.Td>
              <Table.Td>
                {new Date(app.createdAt).toLocaleDateString()}
              </Table.Td>
              {app.id && (
                <Table.Td>
                  <Button
                    component={Link}
                    to={ROUTES.APPLICATION_DETAIL.replace(":id", app.id)}
                    variant="subtle"
                  >
                    View
                  </Button>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
