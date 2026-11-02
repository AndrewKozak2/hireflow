import {
  Avatar,
  Badge,
  Flex,
  RingProgress,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDateTime } from "../../../hooks/useDateTime";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes/routes";

function getInitials(firstName, lastName, email) {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

function getSourceBadgeDetails(source) {
  switch (source?.toLowerCase()) {
    case "djinni":
      return { color: "green", label: "Djinni" };
    case "linkedin":
      return { color: "indigo", label: "LinkedIn" };
    case "talent pool":
      return { color: "grape", label: "Talent Pool" };
    default:
      return { color: "gray", label: source || "Email" };
  }
}

export function NewApplicationsTable({ applications }) {
  const { formatRelativeDate } = useDateTime();
  const navigate = useNavigate();

  const handleViewApplication = (id) => {
    navigate(ROUTES.APPLICATION_DETAIL.replace(":id", id));
  };

  const getScoreColor = (val) =>
    val >= 70 ? "green" : val < 70 && val >= 50 ? "yellow" : "red";

  return (
    <Stack gap={0} w="100%">
      {applications.map((app) => {
        const hasFullDetail =
          app.candidate?.firstName || app.candidate?.lastName;
        const displayName = hasFullDetail
          ? `${app.candidate.firstName} ${app.candidate.lastName}`
          : app.candidate?.email || "anonymous-applicant@gmail.com";

        const jobTitle = app.job?.title || "Unknown Job";
        const initials = getInitials(
          app.candidate?.firstName,
          app.candidate?.lastName,
          displayName,
        );
        const sourceDetails = getSourceBadgeDetails(app.source);

        return (
          <UnstyledButton
            key={app.id}
            onClick={() => handleViewApplication(app.id)}
            sx={{
              padding: "var(--mantine-spacing-md) 0",
              borderBottom: "1px solid var(--mantine-color-gray-2)",
              width: "100%",
            }}
          >
            <Flex align="center" justify="space-between" wrap="nowrap" gap="md">
              <Flex align="center" gap="md" sx={{ flex: 1, minWidth: 0 }}>
                <Avatar color="blue" radius="xl" size="md">
                  {initials}
                </Avatar>

                <Stack gap={2} sx={{ overflow: "hidden" }}>
                  <Text fw={600} size="sm" c="blue.7" truncate>
                    {displayName}
                  </Text>

                  {!hasFullDetail ? (
                    <Text size="xs" c="red" fw={500}>
                      ⚠️ Not matched
                    </Text>
                  ) : (
                    <Text size="xs" c="dimmed" truncate>
                      {jobTitle}
                    </Text>
                  )}
                </Stack>
              </Flex>

              <Flex align="center" gap="xl" sx={{ flexShrink: 0 }}>
                <Badge color={sourceDetails.color} variant="light" size="sm">
                  {sourceDetails.label}
                </Badge>

                <Flex align="center" justify="center" w={45}>
                  {app.aiScore ? (
                    <Badge
                      color={getScoreColor(app.aiScore)}
                      variant="light"
                      radius="xl"
                      size="md"
                    >
                      {app.aiScore}%
                    </Badge>
                  ) : app.source === "email" && !app.aiScore ? (
                    <Badge
                      size="xl"
                      color="gray"
                      variant="light"
                      circle
                      styles={{ label: { fontSize: "8px" } }}
                    >
                      No CV
                    </Badge>
                  ) : (
                    <RingProgress
                      size={24}
                      thickness={3}
                      sections={[{ value: 40, color: "blue" }]}
                    />
                  )}
                </Flex>

                <Text
                  size="xs"
                  c="dimmed"
                  sx={{ width: 60, textAlign: "right" }}
                >
                  {app.createdAt ? formatRelativeDate(app.createdAt) : ""}
                </Text>
              </Flex>
            </Flex>
          </UnstyledButton>
        );
      })}
    </Stack>
  );
}
