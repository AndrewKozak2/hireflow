import { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Title,
  Group,
  Button,
  Text,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Box,
  Skeleton,
  Alert,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconInfoCircle,
} from "@tabler/icons-react";
import { RecruitmentCostsService } from "../../../../services/RecruitmentCostsService";
import { formatUSD } from "../../../../utils/currencyFormatters";
import { useNotifications } from "../../../../hooks/useNotifications";
import { useAuth } from "../../../../hooks/useAuth";
import { ROLES } from "../../../../constants/roles";
import { SOURCE_META } from "../../../../constants/application";
import { AddCostsModal } from "./AddCostsModal";
import { EditCostModal } from "./EditCostModal";

const CATEGORY_LABELS = {
  JOB_POSTING: "Job Posting",
  SOURCE_SUCCESS_FEE: "Source Success Fee",
  INTERVIEW_PAYMENT: "Interview Payment",
  RECRUITER_COMMISSION: "Recruiter Commission",
  REFERRAL_BONUS: "Referral Bonus",
  OTHER: "Other Expense",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSource(source) {
  if (!source) return "—";
  const meta = SOURCE_META[source.toLowerCase()];
  if (meta) return meta.label;
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function JobRecruitmentCostsSection({ jobId, applications = [] }) {
  const { user } = useAuth();
  const { onError, onSuccess } = useNotifications();
  const isHM = user?.role === ROLES.MANAGER;

  const [costs, setCosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);

  const fetchCosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await RecruitmentCostsService.getForJob(jobId);
      setCosts(data.costs || []);
      setTotal(data.total || 0);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err?.response?.data?.message || "Failed to load recruitment costs",
      );
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      setTimeout(() => fetchCosts(), 0);
    }
  }, [jobId, fetchCosts]);

  const handleDelete = async (costId) => {
    try {
      await RecruitmentCostsService.remove(costId);
      onSuccess({ message: "Cost deleted successfully" });
      fetchCosts();
    } catch (err) {
      onError({
        message: err?.response?.data?.message || "Failed to delete cost",
      });
    }
  };

  const getCandidateName = (applicationId) => {
    if (!applicationId) return "—";
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return "—";
    const name = [app.candidate?.firstName, app.candidate?.lastName]
      .filter(Boolean)
      .join(" ");
    return name || "—";
  };

  const getCreatorName = (cost) => cost.creator?.name || "—";

  return (
    <Paper p="lg" withBorder radius="md">
      <Group justify="space-between" mb="md">
        <Stack gap={2}>
          <Title order={4}>Recruitment Costs</Title>
          {!isLoading && !loadError && (
            <Text size="sm" c="dimmed">
              Total job cost:{" "}
              <Text component="span" fw={700} c="dark" ff="monospace">
                {formatUSD(total)}
              </Text>
            </Text>
          )}
        </Stack>
        {!isHM && (
          <Button
            leftSection={<IconPlus size={16} />}
            size="sm"
            onClick={openAdd}
          >
            Add Costs
          </Button>
        )}
      </Group>

      {isLoading ? (
        <Stack gap="xs">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h={36} radius="sm" />
          ))}
        </Stack>
      ) : loadError ? (
        <Alert
          color="red"
          icon={<IconInfoCircle size={16} />}
          variant="light"
          radius="md"
        >
          {loadError}
        </Alert>
      ) : costs.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          No recruitment costs recorded yet.
        </Text>
      ) : (
        <Box style={{ overflowX: "auto" }}>
          <Table verticalSpacing="sm" withColumnBorders withRowBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Candidate</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Created by</Table.Th>
                {!isHM && <Table.Th>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {costs.map((cost) => {
                const isAutomatic = !!cost.automationKey;
                return (
                  <Table.Tr key={cost.id}>
                    <Table.Td>{formatDate(cost.incurredAt)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Text size="sm">
                          {CATEGORY_LABELS[cost.category] || cost.category}
                        </Text>
                        {isAutomatic && (
                          <Badge size="xs" color="gray" variant="light">
                            auto
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>{formatSource(cost.source)}</Table.Td>
                    <Table.Td>{cost.title}</Table.Td>
                    <Table.Td>{getCandidateName(cost.applicationId)}</Table.Td>
                    <Table.Td ff="monospace">{formatUSD(cost.amount)}</Table.Td>
                    <Table.Td>{getCreatorName(cost)}</Table.Td>
                    {!isHM && (
                      <Table.Td>
                        {isAutomatic ? (
                          <Text size="xs" c="dimmed">
                            —
                          </Text>
                        ) : (
                          <Group gap="xs" wrap="nowrap">
                            <Tooltip label="Edit">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                size="sm"
                                onClick={() => setEditTarget(cost)}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                onClick={() => handleDelete(cost.id)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        )}
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      <AddCostsModal
        opened={addOpened}
        onClose={closeAdd}
        jobId={jobId}
        applications={applications}
        onSuccess={() => {
          closeAdd();
          fetchCosts();
        }}
      />

      {editTarget && (
        <EditCostModal
          key={editTarget.id}
          opened={!!editTarget}
          onClose={() => setEditTarget(null)}
          cost={editTarget}
          applications={applications}
          onSuccess={() => {
            setEditTarget(null);
            fetchCosts();
          }}
        />
      )}
    </Paper>
  );
}
