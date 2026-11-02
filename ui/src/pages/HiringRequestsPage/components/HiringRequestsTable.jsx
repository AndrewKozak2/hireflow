import {
  Box,
  Button,
  Group,
  Paper,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { HiringRequestStatusBadge } from "./HiringRequestStatusBadge";
import CreateJobFromRequestButton from "../../JobsPage/components/CreateJobFromRequest";
import { HiringRequestStatus } from "../../../constants/hiringRequestConstants";
import { useDateTime } from "../../../hooks/useDateTime";
import { REQUEST_STATUS_COLOR } from "../../../constants/hiringRequestConstants";
import { ROUTES } from "../../../routes/routes";
import classes from "./HiringRequestsTable.module.css";

function formatDepartment(value) {
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function HiringRequestActions({
  request,
  onViewRequest,
  onViewJob,
  onTakeInReview,
  onDeleteDraft,
  canPerformActions,
  currentUserId,
}) {
  const navigate = useNavigate();
  const isDraft = request.status === HiringRequestStatus.DRAFT;
  const isOwnDraft = isDraft && request.created_by?.id === currentUserId;
  const isPending = request.status === HiringRequestStatus.PENDING;
  const isInReview = request.status === HiringRequestStatus.IN_REVIEW;
  const isApproved = request.status === HiringRequestStatus.APPROVED;

  if (isDraft) {
    return (
      <Group gap="xs" wrap="nowrap" justify="flex-end">
        <Button
          size="sm"
          radius="md"
          variant="default"
          onClick={() =>
            navigate(ROUTES.HIRING_REQUEST_DETAIL.replace(":id", request.id))
          }
        >
          Review
        </Button>
        {isOwnDraft && (
          <Button
            size="sm"
            radius="md"
            variant="light"
            onClick={() =>
              navigate(
                ROUTES.HIRING_REQUESTS_DRAFT_EDIT.replace(":id", request.id),
              )
            }
          >
            Continue
          </Button>
        )}
        {isOwnDraft && (
          <Button
            size="sm"
            radius="md"
            variant="subtle"
            color="red"
            onClick={() => onDeleteDraft(request)}
          >
            Delete
          </Button>
        )}
      </Group>
    );
  }

  return (
    <Group gap="xs" wrap="nowrap" justify="flex-end">
      {isPending && canPerformActions && (
        <Button
          size="sm"
          radius="md"
          color="warning"
          onClick={() => onTakeInReview(request)}
        >
          Take in review
        </Button>
      )}

      {isInReview && canPerformActions && (
        <CreateJobFromRequestButton
          size="sm"
          radius="md"
          color="success"
          hiringRequestId={request.id}
        >
          Create Job
        </CreateJobFromRequestButton>
      )}

      {isApproved && request.job_id ? (
        <Button
          size="sm"
          radius="md"
          variant="default"
          onClick={() => onViewJob(request)}
        >
          View Job
        </Button>
      ) : (
        <Button
          size="sm"
          radius="md"
          variant="default"
          onClick={() => onViewRequest(request)}
        >
          View
        </Button>
      )}
    </Group>
  );
}

export function HiringRequestsTable({
  requests,
  onViewRequest,
  onViewJob,
  onTakeInReview,
  onDeleteDraft,
  canPerformActions,
  currentUserId,
}) {
  const theme = useMantineTheme();
  const { formatRelativeDate, formatShortDate } = useDateTime();

  const formatDeadline = (value) => formatShortDate(value);

  const rows = requests.map((request) => {
    const statusColor = REQUEST_STATUS_COLOR[request.status] || "gray";
    const isCancelled = request.status === HiringRequestStatus.CANCELLED;

    return (
      <Table.Tr
        key={request.id}
        className={classes.row}
        data-color={statusColor}
        data-cancelled={isCancelled}
      >
        <Table.Td className={classes.cellFirst}>
          <Text
            className={classes.jobTitle}
            onClick={() => onViewRequest(request)}
          >
            {request.job_title}
          </Text>
        </Table.Td>

        <Table.Td className={classes.cell}>
          <HiringRequestStatusBadge status={request.status} />
        </Table.Td>

        <Table.Td className={classes.cell}>
          <Text c={theme.other.appColors.textPrimary}>
            {formatDepartment(request.department)}
          </Text>
        </Table.Td>

        <Table.Td className={classes.cell}>
          <Text>{request.created_by?.name}</Text>
          <Text size="sm" c="dimmed" mt={4}>
            {request.created_by?.email}
          </Text>
        </Table.Td>

        <Table.Td className={classes.cell}>
          <Text c="dimmed">{formatRelativeDate(request.created_at)}</Text>
        </Table.Td>

        <Table.Td className={classes.cell}>
          <Text>{request.headcount}</Text>
        </Table.Td>

        <Table.Td className={classes.cell}>
          <Text c="dimmed">{formatDeadline(request.deadline)}</Text>
        </Table.Td>

        <Table.Td className={`${classes.cell} ${classes.textRight}`}>
          <HiringRequestActions
            request={request}
            onViewRequest={onViewRequest}
            onViewJob={onViewJob}
            onTakeInReview={onTakeInReview}
            onDeleteDraft={onDeleteDraft}
            canPerformActions={canPerformActions}
            currentUserId={currentUserId}
          />
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Box className={classes.tableContainer}>
      <Paper
        withBorder
        radius="xl"
        className={classes.tablePaper}
        style={{
          borderColor: theme.other.appColors.border,
          backgroundColor: theme.other.appColors.surface,
        }}
      >
        <Table highlightOnHover className={classes.table}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className={classes.tableHeader}>Position</Table.Th>
              <Table.Th className={classes.tableHeader}>Status</Table.Th>
              <Table.Th className={classes.tableHeader}>Department</Table.Th>
              <Table.Th className={classes.tableHeader}>Requested By</Table.Th>
              <Table.Th className={classes.tableHeader}>Submitted</Table.Th>
              <Table.Th className={classes.tableHeader}>HC</Table.Th>
              <Table.Th className={classes.tableHeader}>Deadline</Table.Th>
              <Table.Th
                className={`${classes.tableHeader} ${classes.textRight}`}
              >
                Actions
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </Box>
  );
}
