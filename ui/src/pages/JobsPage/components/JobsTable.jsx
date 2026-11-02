import { Table, Group, Button, Anchor } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../hooks/useNotifications";
import { ROLES } from "../../../constants/roles";
import { ROUTES } from "../../../routes/routes";
import { JobsService } from "../../../services/JobsService";
import { useDateTime } from "../../../hooks/useDateTime";
import { JOB_STATUSES } from "../../../constants/job";

export function JobsTable({ jobs, onUpdateStatus, onDelete, onRefresh }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatRelativeDate } = useDateTime();
  const { onSuccess, onError } = useNotifications();

  const handleEdit = (id) => {
    navigate(ROUTES.EDIT_JOB.replace(":id", id));
  };

  function handleView(id) {
    navigate(ROUTES.JOB_DETAIL.replace(":id", id));
  }

  const handleApprove = async (jobId) => {
    try {
      await JobsService.approve(jobId);
      onSuccess({ message: "Job approved successfully" });
      onRefresh?.();
    } catch (err) {
      onError({
        message: err.response?.data?.message || "Failed to approve job",
      });
    }
  };

  const handleReject = async (jobId) => {
    try {
      await JobsService.reject(jobId);
      onSuccess({ message: "Job rejected successfully" });
      onRefresh?.();
    } catch (err) {
      onError({
        message: err.response?.data?.message || "Failed to reject job",
      });
    }
  };

  const renderActions = (job) => {
    const isRecruiter =
      user?.role === ROLES.RECRUITER || user?.role === ROLES.ADMIN;
    const isHM = user?.role === ROLES.MANAGER;
    const isAssignedHM = isHM && job.hiringManagerId === user.id;

    if (isRecruiter) {
      switch (job.status) {
        case JOB_STATUSES.DRAFT:
          return (
            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                onClick={() => handleEdit(job.id)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  JobsService.updateStatus(
                    job.id,
                    JOB_STATUSES.PENDING_APPROVAL,
                  )
                }
              >
                Submit
              </Button>
              <Button
                variant="subtle"
                color="red"
                size="xs"
                onClick={() => onDelete(job.id)}
              >
                Delete
              </Button>
            </Group>
          );
        case JOB_STATUSES.PENDING_APPROVAL:
          return (
            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                onClick={() => handleView(job.id)}
              >
                View
              </Button>
            </Group>
          );
        case JOB_STATUSES.ACTIVE:
          return (
            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                onClick={() => handleView(job.id)}
              >
                View
              </Button>
              <Button
                variant="outline"
                color="orange"
                size="xs"
                onClick={() => onUpdateStatus(job.id, JOB_STATUSES.PAUSED)}
              >
                Pause
              </Button>
              <Button
                variant="outline"
                color="red"
                size="xs"
                onClick={() => onUpdateStatus(job.id, JOB_STATUSES.CLOSED)}
              >
                Close
              </Button>
            </Group>
          );
        case JOB_STATUSES.PAUSED:
          return (
            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                onClick={() => handleView(job.id)}
              >
                View
              </Button>
              <Button
                variant="outline"
                color="green"
                size="xs"
                onClick={() => onUpdateStatus(job.id, JOB_STATUSES.ACTIVE)}
              >
                Resume
              </Button>
              <Button
                variant="outline"
                color="red"
                size="xs"
                onClick={() => onUpdateStatus(job.id, JOB_STATUSES.CLOSED)}
              >
                Close
              </Button>
            </Group>
          );
        case JOB_STATUSES.CLOSED:
          return (
            <Button
              variant="light"
              size="xs"
              onClick={() => handleView(job.id)}
            >
              View
            </Button>
          );
        default:
          return null;
      }
    }

    if (isAssignedHM && job.status === JOB_STATUSES.PENDING_APPROVAL) {
      return (
        <Group gap="xs">
          <Button
            variant="filled"
            color="green"
            size="xs"
            style={{ minWidth: 70 }}
            onClick={() => handleApprove(job.id)}
          >
            Approve
          </Button>
          <Button
            variant="filled"
            color="red"
            size="xs"
            style={{ minWidth: 70 }}
            onClick={() => handleReject(job.id)}
          >
            Reject
          </Button>
        </Group>
      );
    }

    return (
      <Button variant="light" size="xs" onClick={() => handleView(job.id)}>
        View
      </Button>
    );
  };

  const rows = jobs.map((job) => (
    <Table.Tr key={job.id}>
      <Table.Td>
        <Anchor
          fw={500}
          c={"#000"}
          underline="hover"
          onClick={() => handleView(job.id)}
        >
          {job.title}
        </Anchor>
      </Table.Td>
      <Table.Td>{job.recruiter}</Table.Td>
      <Table.Td>{job.hiringManager}</Table.Td>
      <Table.Td>{job.applicationsCount ?? 0}</Table.Td>
      <Table.Td>
        <StatusBadge status={job.status} />
      </Table.Td>
      <Table.Td>{formatRelativeDate(job.createdAt)}</Table.Td>
      <Table.Td>{renderActions(job)}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Table verticalSpacing="sm">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Title</Table.Th>
          <Table.Th>Recruiter</Table.Th>
          <Table.Th>Hiring Manager</Table.Th>
          <Table.Th>Applications</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
