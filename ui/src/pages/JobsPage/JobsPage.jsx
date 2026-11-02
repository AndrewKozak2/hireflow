import React from "react";
import {
  Tabs,
  Group,
  Paper,
  Text,
  Alert,
  Center,
  Button,
  Badge,
} from "@mantine/core";
import { useJobs } from "../../hooks/useJobs";
import { PageLoader } from "../../components/PageLoader";
import { JobsTable } from "./components/JobsTable";
import CreateJobFromRequestButton from "./components/CreateJobFromRequest";

function SummaryLine({ counts }) {
  const parts = [];
  if (counts.active) parts.push(`${counts.active} active`);
  if (counts.pending_approval)
    parts.push(`${counts.pending_approval} pending approval`);
  if (counts.draft) parts.push(`${counts.draft} draft`);
  if (!parts.length) return null;
  return (
    <Text size="sm" c="dimmed" mt={4}>
      {parts.join(" · ")}
    </Text>
  );
}

function TabLabel({ label, count }) {
  return (
    <Group gap={8} wrap="nowrap">
      <span>{label}</span>
      {count > 0 && (
        <Badge
          variant="light"
          color="gray"
          size="xs"
          circle
          style={{ pointerEvents: "none" }}
        >
          {count}
        </Badge>
      )}
    </Group>
  );
}

export default function JobsPage() {
  const {
    jobs,
    counts,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    updateJobStatus,
    deleteJob,
    refreshJobs,
    canCreateJob,
  } = useJobs();

  if (isLoading && jobs.length === 0) {
    return <PageLoader />;
  }

  return (
    <div>
      <Group justify="space-between" align="flex-start" mb={4}>
        <div>
          <SummaryLine counts={counts} />
        </div>
        {canCreateJob && (
          <CreateJobFromRequestButton
            component={Button}
            color="indigo"
            radius="md"
            size="sm"
            children="Create Job"
          ></CreateJobFromRequestButton>
        )}
      </Group>

      {error && (
        <Alert color="red" title="Error" mb="md" mt="md">
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setActiveTab} mt="lg" mb="md">
        <Tabs.List>
          <Tabs.Tab value="all">All</Tabs.Tab>
          <Tabs.Tab value="draft">
            <TabLabel label="Draft" count={counts.draft} />
          </Tabs.Tab>
          <Tabs.Tab value="pending_approval">
            <TabLabel
              label="Pending Approval"
              count={counts.pending_approval}
              tabValue="pending_approval"
              activeTab={activeTab}
            />
          </Tabs.Tab>
          <Tabs.Tab value="active">
            <TabLabel label="Active" count={counts.active} />
          </Tabs.Tab>
          <Tabs.Tab value="paused">
            <TabLabel label="Paused" count={counts.paused} />
          </Tabs.Tab>
          <Tabs.Tab value="closed">
            <TabLabel label="Closed" count={counts.closed} />
          </Tabs.Tab>
          <Tabs.Tab value="rejected">
            <TabLabel label="Rejected" count={counts.rejected} />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Paper withBorder radius="md" p="md">
        {jobs.length > 0 ? (
          <JobsTable
            jobs={jobs}
            onUpdateStatus={updateJobStatus}
            onDelete={deleteJob}
            onRefresh={refreshJobs}
          />
        ) : (
          <Center h={200}>
            <Text c="dimmed">No jobs found for the selected filter.</Text>
          </Center>
        )}
      </Paper>
    </div>
  );
}
