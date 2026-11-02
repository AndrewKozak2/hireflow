import React, { useState, useEffect } from "react";
import {
  Text,
  Badge,
  Anchor,
  Button,
  Loader,
  Center,
  Card,
  Flex,
  Box,
  Divider,
} from "@mantine/core";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ApplicationsService } from "../../../services/ApplicationsService";
import { ROUTES } from "../../../routes/routes";
import { STAGE_MAPPING } from "../../../constants/application";

dayjs.extend(relativeTime);

export function CandidateApplicationsList({ candidateId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const res = await ApplicationsService.getApplications({
          candidateId,
        });
        const result = res?.data?.items || res?.data || res?.items || res || [];
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) fetchApps();
  }, [candidateId]);

  if (loading)
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );

  if (data.length === 0) {
    return (
      <Card withBorder radius="md" p="xl">
        <Center py="xl">
          <Text c="dimmed">No applications found for this candidate.</Text>
        </Center>
      </Card>
    );
  }

  const groupedData = data.reduce((acc, app) => {
    const jId = app.job?.id || app.jobId || "unknown";
    if (!acc[jId]) {
      acc[jId] = {
        job: app.job || { title: "Unknown Job", location: "Unknown" },
        applications: [],
      };
    }
    acc[jId].applications.push(app);
    return acc;
  }, {});

  return (
    <Card withBorder radius="md" padding="lg">
      <Flex direction="column" gap="xs">
        {Object.values(groupedData).map(({ job, applications }, jobIndex) => (
          <Box key={job.id || jobIndex}>
            {jobIndex > 0 && <Divider my="sm" color="gray.1" />}

            <Flex direction="column" gap="md">
              {applications.map((app) => {
                const stageContext = STAGE_MAPPING[app.stage] || {
                  label: app.stage,
                  color: "gray",
                };
                const timeAgo = dayjs(app.createdAt).fromNow();
                const recruiterName = job.recruiter.name || "Unknown Recruiter";

                return (
                  <Flex
                    key={app.id}
                    justify="space-between"
                    align="center"
                    gap="md"
                    wrap="wrap"
                  >
                    <Box>
                      <Anchor
                        component={Link}
                        to={`/jobs/${job.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Text fw={600} c="black">
                          {job.title}
                        </Text>
                      </Anchor>
                      <Text size="xs" c="dimmed" mt={4}>
                        Recruiter: {recruiterName} · {timeAgo}
                      </Text>
                    </Box>

                    <Flex gap="sm" align="center">
                      <Center
                        w={32}
                        h={32}
                        bg="green.2"
                        c="green.9"
                        style={{ borderRadius: "50%" }}
                        title="AI Score"
                      >
                        <Text size="sm" fw={600}>
                          {app.aiScore ? `${app.aiScore}%` : "%"}
                        </Text>
                      </Center>
                      <Badge
                        color={stageContext.color}
                        variant="filled"
                        radius="xl"
                        size="md"
                      >
                        {stageContext.label}
                      </Badge>
                      <Button
                        component={Link}
                        to={
                          ROUTES.APPLICATION_DETAIL.replace(":id", app.id) ||
                          `/applications/${app.id}`
                        }
                        variant="subtle"
                        size="sm"
                        fw={500}
                      >
                        View →
                      </Button>
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Card>
  );
}
