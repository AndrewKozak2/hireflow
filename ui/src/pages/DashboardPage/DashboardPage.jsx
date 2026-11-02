import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Anchor,
  Card,
  Center,
  Flex,
  Title,
  SimpleGrid,
  Text,
  Box,
  Group,
  Stack,
} from "@mantine/core";
import { ROUTES } from "../../routes/routes";
import { useHiringRequests } from "./hooks/useHiringRequests";
import { useAuth } from "../../hooks/useAuth";
import { useJobs } from "../../hooks/useJobs";
import { useAnalyticsStats } from "./hooks/useAnalyticsStats";
import { HiringRequestsTable } from "./components/HiringRequestsTable";
import { PageLoader } from "../../components/PageLoader/PageLoader";
import { StatsGrid } from "./components/StatsGrid";
import { useNewApplications } from "./hooks/useNewApplications";
import { NewApplicationsTable } from "./components/NewApplicationsTable";
import { useJobsStore } from "../../stores/useJobsStore";
import { ROLES } from "../../constants/roles";
import { JobsNeedingAttention } from "./components/JobsNeedingAttention";

export default function DashboardPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const isAdmin =
    user?.role === ROLES.ADMIN || user?.role === ROLES.super_admin;
  const isRecruiter = user?.role === ROLES.RECRUITER;
  const isManager = user?.role === ROLES.MANAGER;

  const userName = user?.firstName || user?.name?.split(" ")[0] || "User";

  const { stats, isLoading: statsLoading } = useAnalyticsStats();

  const enhancedStats = useMemo(() => {
    if (!stats || !Array.isArray(stats)) return [];

    let filteredStats = stats;
    if (isManager) {
      filteredStats = stats.filter((stat) => {
        const title = String(stat.title || stat.label || "").toUpperCase();
        return (
          title.includes("OPEN POSITIONS") || title.includes("PENDING ACTIONS")
        );
      });
    }

    return filteredStats.map((stat) => {
      const title = String(stat.title || stat.label || "").toUpperCase();
      let onClick = undefined;

      if (title.includes("OPEN POSITIONS")) {
        onClick = () => {
          useJobsStore.getState().setActiveTab("active");
          navigate(ROUTES.JOBS || "/jobs");
        };
      } else if (title.includes("NEW APPLICATIONS")) {
        onClick = () => {
          navigate(ROUTES.APPLICATIONS || "/applications", {
            state: { initialTab: "new" },
          });
        };
      }

      return {
        ...stat,
        onClick: onClick,
      };
    });
  }, [stats, navigate, isManager]);

  const {
    requests,
    loading: requestsLoading,
    handleTakeInReview,
  } = useHiringRequests();

  const { applications: newApplications, loading: applicationsLoading } =
    useNewApplications();

  const { jobs, isLoading: jobsLoading } = useJobs();

  const realAttentionJobs = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];

    return jobs
      .filter((job) => {
        if (!job.status) return false;
        const status = String(job.status).toLowerCase();

        if (isAdmin || isRecruiter) {
          return status === "draft" || status === "rejected";
        }

        if (isManager) {
          const isMyJob = job.hiringManagerId === user?.id;
          return status === "pending_approval" && isMyJob;
        }
        return false;
      })

      .map((job) => {
        let statusText = "Needs attention";
        let buttonType = "draft";

        const status = String(job.status).toLowerCase();

        if (status === "draft") {
          statusText = "Draft · Started recently";
          buttonType = "draft";
        } else if (status === "rejected") {
          statusText = "Returned to draft · Requires changes";
          buttonType = "returned";
        } else if (status === "pending_approval") {
          statusText = "Pending approval · Awaiting your review";
          buttonType = "approval";
        }

        return {
          id: job.id,
          title: job.title,
          status: statusText,
          type: buttonType,
          comment:
            job.rejectionComment ||
            job.rejectionReason ||
            job.description ||
            null,
        };
      });
  }, [jobs, isAdmin, isRecruiter, isManager, user?.id]);

  const dashboardRequests = useMemo(() => {
    if (!requests || !Array.isArray(requests)) return [];

    let filteredRequests = [];

    if (isRecruiter || isAdmin) {
      filteredRequests = requests.filter((r) =>
        ["in_review", "pending"].includes(r.status.toLowerCase()),
      );
    } else if (isManager) {
      filteredRequests = requests.filter(
        (r) =>
          r.created_by_id === user?.id &&
          ["draft", "rejected", "pending", "in_review"].includes(
            r.status.toLowerCase(),
          ),
      );
    }

    return filteredRequests
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 3);
  }, [requests, isAdmin, isRecruiter, isManager, user?.id]);

  const pendingCount = useMemo(() => {
    if (isAdmin || isRecruiter) {
      return requests.filter((r) => r.status.toLowerCase() === "pending")
        .length;
    }
    if (isManager) {
      return requests.filter(
        (r) =>
          r.created_by_id === user?.id && r.status.toLowerCase() === "draft",
      ).length;
    }
    return 0;
  }, [requests, isAdmin, isRecruiter, isManager, user?.id]);

  return (
    <Stack gap="xl">
      <Flex justify="space-between" align="flex-end">
        <Box>
          <Title order={2} fw={700}>
            Welcome back, {userName}
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            Here's what needs your attention today.
          </Text>
        </Box>
      </Flex>

      {statsLoading ? (
        <PageLoader />
      ) : (
        <StatsGrid
          data={enhancedStats}
          isManager={isManager}
          isAdmin={isAdmin}
        />
      )}

      <SimpleGrid
        cols={{ base: 1, md: isManager ? 1 : 2 }}
        spacing="lg"
        align="flex-start"
      >
        <Card withBorder radius="md" padding="lg">
          <Flex justify="space-between" align="center" mb="md">
            <Group gap="xs">
              <Text fw={600} size="lg">
                Hiring Requests
              </Text>
              {!requestsLoading && (
                <Text size="xs" c="dimmed">
                  {pendingCount > 0 && ` ${pendingCount} pending`}
                </Text>
              )}
            </Group>
            <Anchor
              size="sm"
              c="blue"
              fw={500}
              onClick={() => navigate(ROUTES.HIRING_REQUESTS)}
            >
              View all →
            </Anchor>
          </Flex>

          {requestsLoading ? (
            <PageLoader />
          ) : dashboardRequests.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">
                {requests.length > 0
                  ? "All your requests have been approved"
                  : "You haven't submitted any requests yet"}
              </Text>
            </Center>
          ) : (
            <HiringRequestsTable
              requests={dashboardRequests}
              isRecruiterOrAdmin={isAdmin || isRecruiter}
              onTakeInReview={handleTakeInReview}
              onView={(id) =>
                navigate(
                  isAdmin || isRecruiter
                    ? `${ROUTES.HIRING_REQUESTS}/${id}`
                    : ROUTES.HIRING_REQUEST_DETAIL.replace(":id", id),
                )
              }
            />
          )}
        </Card>

        {!isManager && (
          <Card withBorder radius="md" padding="lg">
            {applicationsLoading ? (
              <PageLoader />
            ) : !newApplications?.items ||
              newApplications.items.length === 0 ? (
              <Box>
                <Flex justify="space-between" align="center" mb="md">
                  <Text fw={600} size="lg">
                    New Applications
                  </Text>
                  <Anchor
                    size="sm"
                    c="blue"
                    fw={500}
                    onClick={() =>
                      navigate(ROUTES.APPLICATIONS || "/applications")
                    }
                  >
                    View all →
                  </Anchor>
                </Flex>
                <Center py="xl">
                  <Text c="dimmed">No new applications at the moment</Text>
                </Center>
              </Box>
            ) : (
              <Box>
                <Flex justify="space-between" align="center" mb="md">
                  <Text fw={600} size="lg">
                    New Applications
                  </Text>
                  <Anchor
                    size="sm"
                    c="blue"
                    fw={500}
                    onClick={() =>
                      navigate(ROUTES.APPLICATIONS || "/applications")
                    }
                  >
                    View all →
                  </Anchor>
                </Flex>
                <NewApplicationsTable
                  applications={newApplications?.items || []}
                />
              </Box>
            )}
          </Card>
        )}
      </SimpleGrid>

      {jobsLoading ? (
        <PageLoader />
      ) : (
        <Card withBorder radius="md" padding="lg">
          {realAttentionJobs.length === 0 ? (
            <Box>
              <Text fw={600} size="lg" mb="md">
                Jobs needing attention
              </Text>
              <Center py="xl">
                <Text c="dimmed">No jobs require attention right now</Text>
              </Center>
            </Box>
          ) : (
            <JobsNeedingAttention
              jobs={realAttentionJobs}
              onAction={(id, type) => {
                if (type === "approval") {
                  navigate(ROUTES.JOB_DETAIL.replace(":id", id));
                } else {
                  navigate(ROUTES.EDIT_JOB.replace(":id", id));
                }
              }}
            />
          )}
        </Card>
      )}
    </Stack>
  );
}
