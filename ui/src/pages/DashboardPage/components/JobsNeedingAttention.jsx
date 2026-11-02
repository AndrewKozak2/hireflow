import { Box, Flex, Group, Text, Button, Stack } from "@mantine/core";
import { IconBriefcase } from "@tabler/icons-react";

export function JobsNeedingAttention({ jobs, onAction }) {
  return (
    <Box>
      <Text fw={600} size="lg" mb="md">
        Jobs needing attention
      </Text>
      <Stack gap="md">
        {jobs.map((job) => (
          <Box
            key={job.id}
            p="sm"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}
          >
            <Flex justify="space-between" align="flex-start">
              <Group gap="sm" align="flex-start">
                <Box mt={2}>
                  <IconBriefcase
                    size={18}
                    color="var(--mantine-color-gray-5)"
                  />
                </Box>
                <Box>
                  <Text
                    fw={600}
                    size="sm"
                    c="blue.6"
                    style={{ cursor: "pointer" }}
                    onClick={() => onAction?.(job.id, job.type)}
                  >
                    {job.title}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {job.status}
                  </Text>

                  {job.comment && (
                    <Box
                      mt="xs"
                      p="xs"
                      style={{
                        backgroundColor: "var(--mantine-color-red-0)",
                        borderRadius: "4px",
                        borderLeft: "3px solid var(--mantine-color-red-4)",
                      }}
                    >
                      <Text size="xs" style={{ fontStyle: "italic" }}>
                        {job.comment}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Group>

              <Button
                size="xs"
                variant="light"
                color={
                  job.type === "draft"
                    ? "gray"
                    : job.type === "approval"
                      ? "green"
                      : "blue"
                }
                onClick={() => onAction?.(job.id, job.type)}
              >
                {job.type === "draft" && "Continue editing"}
                {job.type === "returned" && "Edit & resubmit"}
                {job.type === "approval" && "Review & Approve"}
              </Button>
            </Flex>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
