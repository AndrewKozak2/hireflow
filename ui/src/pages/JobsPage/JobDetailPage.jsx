import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import {
  Title,
  Tabs,
  Group,
  Button,
  Container,
  Text,
  Paper,
  Alert,
  Breadcrumbs,
  Anchor,
  Badge,
  Stack,
  Grid,
  Divider,
  Box,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconLayoutColumns,
  IconInfoCircle,
  IconHistory,
  IconUsers,
  IconBriefcase,
  IconMapPin,
  IconUser,
  IconPlus,
  IconMoneybagMinus,
} from "@tabler/icons-react";
import { useJobDetail } from "../../hooks/useJobDetail";
import { useAuth } from "../../hooks/useAuth";
import { PageLoader } from "../../components/PageLoader.jsx";
import { ROUTES } from "../../routes/routes";
import { PipelineTab } from "./components/PipelineTab/PipelineTab.jsx";
import { ApplicationsList } from "./components/ApplicationsList.jsx";
import { ApprovalHistory } from "./components/ApprovalHistory.jsx";
import { JobStatusTimeline } from "./components/JobStatusTimeline.jsx";
import { AddApplicationDrawer } from "../../components/AddApplicationDrawer/AddApplicationDrawer.jsx";
import { useNotifications } from "../../hooks/useNotifications";
import { usePipeline } from "../../hooks/usePipeline.js";
import { JobsService } from "../../services/JobsService";
import { ROLES } from "../../constants/roles";
import { JOB_STATUSES } from "../../constants/job";
import { JobRecruitmentCostsSection } from "./components/RecruitmentCosts/JobRecruitmentCostsSection";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onSuccess, onError } = useNotifications();
  const {
    job,
    isLoading: isLoadingJob,
    error: errorJob,
    refresh: refreshJob,
  } = useJobDetail(id);
  const {
    rawApplications,
    groupedApplications,
    totalApplicationsCount,
    isLoadingApplications,
    errorApplications,
    refreshApplications,
    moveApplication,
  } = usePipeline(id);
  const [opened, { open, close }] = useDisclosure(false);
  const [collapsedColumns, setCollapsedColumns] = useState({});

  const handleApprove = async () => {
    try {
      await JobsService.approve(id);
      onSuccess({ message: "Job approved and is now active!" });
      refreshJob();
    } catch {
      onError({ message: "Failed to approve job" });
    }
  };

  const handleReject = async () => {
    try {
      await JobsService.reject(id);
      onSuccess({ message: "Job has been sent back to draft" });
      refreshJob();
    } catch {
      onError({ message: "Failed to reject job" });
    }
  };

  if (isLoadingJob || isLoadingApplications) return <PageLoader />;
  if (errorJob || errorApplications)
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Error" icon={<IconInfoCircle />} mt="xl">
          {errorJob || errorApplications || "Job not found"}
        </Alert>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate(ROUTES.JOBS)}
          mt="md"
        >
          Back to Jobs
        </Button>
      </Container>
    );

  if (!job)
    return (
      <Container size="xl" py="xl">
        <Alert color="gray" title="Not Found" mt="xl">
          Job listing could not be found.
        </Alert>
        <Button variant="subtle" onClick={() => navigate(ROUTES.JOBS)} mt="md">
          Back to Jobs
        </Button>
      </Container>
    );

  const isRecruiterOrAdmin =
    user?.role === ROLES.ADMIN || user?.role === ROLES.RECRUITER;
  const isAssignedHM =
    user?.role === ROLES.MANAGER &&
    (job.hiringManagerId === user.id || job.hiringManager?.id === user.id);

  const isPending = job.status === "pending_approval";
  const isActive = job.status === "active";

  if (!job) return null;

  const breadcrumbs = [
    { title: "Jobs", href: ROUTES.JOBS },
    { title: job.title, href: ROUTES.JOB_DETAIL.replace(":id", id) },
  ].map((item, index) => (
    <Anchor
      href={item.href}
      key={index}
      onClick={(e) => {
        e.preventDefault();
        navigate(item.href);
      }}
      size="sm"
      c="dimmed"
    >
      {item.title}
    </Anchor>
  ));

  const handleToggleColumn = (stage) => {
    setCollapsedColumns((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  return (
    <Container size="xl" py="md" width="100%" ml="0">
      <Box mb="lg">
        <Breadcrumbs mb="xs">{breadcrumbs}</Breadcrumbs>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Group gap="sm">
              <Title order={2}>{job.title}</Title>
              <Badge
                variant="light"
                color={
                  job.status === JOB_STATUSES.ACTIVE
                    ? "green"
                    : job.status === JOB_STATUSES.CLOSED
                      ? "red"
                      : "gray"
                }
              >
                {job.status}
              </Badge>
            </Group>
            <Group gap="md" c="dimmed">
              <Group gap={4}>
                <IconBriefcase size={16} />
                <Text size="sm">{job.department}</Text>
              </Group>
              <Group gap={4}>
                <IconMapPin size={16} />
                <Text size="sm">{job.location}</Text>
              </Group>
              <Group gap={4}>
                <IconUser size={16} />
                <Text size="sm">
                  Recruiter: {job.recruiter?.name || "Unassigned"}
                </Text>
              </Group>
              <Group gap={4}>
                <IconUser size={16} />
                <Text size="sm">
                  HM: {job.hiringManager?.name || "Unassigned"}
                </Text>
              </Group>
            </Group>
          </Stack>
          <Group gap="sm">
            {isAssignedHM && isPending && (
              <Group gap="xs">
                <Button color="green" onClick={handleApprove}>
                  Approve Job
                </Button>
                <Button color="red" variant="outline" onClick={handleReject}>
                  Reject
                </Button>
              </Group>
            )}
            {isRecruiterOrAdmin && (
              <Group gap="xs">
                {(job.status === JOB_STATUSES.DRAFT ||
                  job.status === JOB_STATUSES.REJECTED) && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(ROUTES.EDIT_JOB.replace(":id", id))}
                  >
                    Edit Draft
                  </Button>
                )}
              </Group>
            )}
          </Group>
        </Group>
      </Box>

      <Box mb="xl">
        <JobStatusTimeline status={job.status} />
      </Box>

      <Tabs defaultValue="overview" variant="outline" radius="md">
        <Tabs.List mb="lg">
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab
            value="applications"
            leftSection={<IconUsers size={16} />}
            rightSection={
              <Badge variant="light" radius="xl" tt="none" color="gray" circle>
                {totalApplicationsCount}
              </Badge>
            }
          >
            Applications
          </Tabs.Tab>
          <Tabs.Tab value="approval" leftSection={<IconHistory size={16} />}>
            Approval History
          </Tabs.Tab>
          <Tabs.Tab
            value="pipeline"
            leftSection={<IconLayoutColumns size={16} />}
          >
            Pipeline
          </Tabs.Tab>
          <Tabs.Tab value="costs" leftSection={<IconMoneybagMinus size={16} />}>
            Recruitment costs
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="xl">
                <Paper p="lg" withBorder radius="md">
                  <Title order={4} mb="md">
                    About the role
                  </Title>
                  <Text style={{ whiteSpace: "pre-wrap" }}>
                    {job.description || "No description provided."}
                  </Text>

                  <Divider my="xl" />

                  <Title order={4} mb="md">
                    Key Responsibilities
                  </Title>
                  <Text style={{ whiteSpace: "pre-wrap" }}>
                    {job.requirements || "No responsibilities provided."}
                  </Text>

                  <Divider my="xl" />

                  <Title order={4} mb="md">
                    Nice to have
                  </Title>
                  <Text style={{ whiteSpace: "pre-wrap" }}>
                    {job.niceToHave || "None specified."}
                  </Text>
                </Paper>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                <Paper p="lg" withBorder radius="md">
                  <Title order={4} mb="md">
                    Job Details
                  </Title>
                  <Stack gap="sm">
                    <Box>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Employment Type
                      </Text>
                      <Text size="sm">{job.employmentType || "—"}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Work Mode
                      </Text>
                      <Text size="sm">{job.location || "—"}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Headcount
                      </Text>
                      <Text size="sm">{job.headcount || "—"}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Expertise Level
                      </Text>
                      <Text size="sm">{job.expertise_level || "—"}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        English Level
                      </Text>
                      <Text size="sm">{job.english_level || "—"}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Salary Range
                      </Text>
                      <Text size="sm">
                        {job.salary_min && job.salary_max
                          ? `${job.salary_min} - ${job.salary_max} ${
                              job.currency || ""
                            }`
                          : "Not specified"}
                      </Text>
                    </Box>
                  </Stack>
                </Paper>

                <Paper p="lg" withBorder radius="md">
                  <Title order={4} mb="md">
                    Pipeline Summary
                  </Title>
                  <Text size="sm" c="dimmed">
                    Detailed summary coming soon.
                  </Text>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="costs">
          <JobRecruitmentCostsSection
            jobId={id}
            applications={rawApplications}
          />
        </Tabs.Panel>

        <Tabs.Panel value="pipeline">
          <PipelineTab
            jobId={id}
            isPipelineLocked={job.status === JOB_STATUSES.CLOSED}
            collapsedColumns={collapsedColumns}
            onToggleColumn={handleToggleColumn}
            groupedApplications={groupedApplications}
            isLoadingApplications={isLoadingApplications}
            errorApplications={errorApplications}
            moveApplication={moveApplication}
            onRefreshApplications={refreshApplications}
          />
        </Tabs.Panel>

        <Tabs.Panel value="applications">
          <Group justify="flex-end" mb={"md"}>
            {(user?.role === "admin" || user?.role === "recruiter") && (
              <Tooltip label="Job must be active" disabled={isActive}>
                <Button
                  color="indigo"
                  size="sm"
                  variant="default"
                  leftSection={<IconPlus size={16} />}
                  onClick={open}
                  disabled={!isActive ? true : false}
                >
                  Add ManualLy
                </Button>
              </Tooltip>
            )}
          </Group>
          <Paper p="md" withBorder radius="md">
            <ApplicationsList
              applications={rawApplications}
              isLoading={isLoadingApplications}
              error={errorApplications}
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="approval">
          <Paper p="md" withBorder radius="md">
            <ApprovalHistory approvals={job.approvals} />
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <AddApplicationDrawer
        opened={opened}
        onClose={close}
        initialJobId={id}
        onUpdate={refreshApplications}
      />
    </Container>
  );
}
