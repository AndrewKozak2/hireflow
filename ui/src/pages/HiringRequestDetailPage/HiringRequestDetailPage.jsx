import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../routes/routes";
import { ROLES } from "../../constants/roles";
import CreateJobFromRequestButton from "../JobsPage/components/CreateJobFromRequest";
import { HiringRequestsService } from "../../services/HiringRequestsService";
import { HiringRequestStatus } from "../../constants/hiringRequestConstants";
import { HiringRequestStatusBadge } from "../HiringRequestsPage/components/HiringRequestStatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { useDateTime } from "../../hooks/useDateTime";
import { RejectHiringRequestModal } from "../HiringRequestsPage/components/RejectHiringRequestModal";
import { HiringRequestReviewHistory } from "../HiringRequestsPage/components/HiringRequestReviewHistory";
import { useRejectHiringRequest } from "../HiringRequestsPage/hooks/useRejectHiringRequest";
import { normalizeHiringRequestNotes } from "../HiringRequestsPage/form/formConfig";
import { HiringRequestStatusTimeline } from "./components/HiringRequestStatusTimeline";
import { HiringRequestDetailsCard } from "./components/HiringRequestDetailsCard";
import { InternalNotesCard } from "./components/InternalNotesCard";
import { HiringManagerNotesCard } from "./components/HiringManagerNotesCard";
import { useInternalNotes } from "../../hooks/useInternalNotes";

function formatEnumLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function HiringRequestDetailPage() {
  const theme = useMantineTheme();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(undefined);
  const [forbidden, setForbidden] = useState(false);
  const { formatLongDate, formatRelativeDate } = useDateTime();

  const {
    rejectTarget,
    rejecting,
    openRejectModal,
    closeRejectModal,
    confirmReject,
  } = useRejectHiringRequest({
    onRejected: setRequest,
  });

  const {
    notes,
    setNotes,
    isSaving: isSavingNotes,
    isSaved: isNotesSaved,
    handleSaveNotes,
  } = useInternalNotes({
    requestId: id,
    onUpdate: setRequest,
  });

  const canManageInternalNotes =
    user?.role === ROLES.ADMIN || user?.role === ROLES.RECRUITER;

  useEffect(() => {
    HiringRequestsService.getHiringRequestById(id)
      .then((result) => {
        setRequest(result);
      })
      .catch((err) => {
        if (err?.response?.status === 403) {
          setForbidden(true);
          setTimeout(
            () => navigate(ROUTES.HIRING_REQUESTS, { replace: true }),
            3000,
          );
        } else {
          setRequest(null);
        }
      });
  }, [id, navigate]);

  if (forbidden) {
    return (
      <Container size="md" py="xl">
        <Alert
          variant="light"
          color="red"
          title="Access denied"
          icon={<IconInfoCircle size={18} />}
        >
          You don&apos;t have permission to view this request. Redirecting back…
        </Alert>
      </Container>
    );
  }

  if (request === undefined) {
    return null;
  }

  if (!request) {
    return (
      <Alert
        variant="light"
        color="red"
        title="Request not found"
        icon={<IconInfoCircle size={18} />}
      >
        We could not find the hiring request you were trying to open.
      </Alert>
    );
  }

  const isPending = request.status === HiringRequestStatus.PENDING;
  const isInReview = request.status === HiringRequestStatus.IN_REVIEW;
  const canReject = user?.role !== ROLES.MANAGER && isInReview;

  const submittedBy = request.created_by?.name || "—";
  const submittedMeta = `${formatEnumLabel(request.department)} · Submitted by ${submittedBy} · ${formatRelativeDate(request.created_at)}`;

  const handleTakeInReview = () => {
    HiringRequestsService.takeHiringRequestInReview(request.id).then(
      (updatedRequest) => {
        if (updatedRequest) {
          setRequest(updatedRequest);
        }
      },
    );
  };

  return (
    <Box p={theme.spacing.md}>
      <Stack gap="xl">
        <Box>
          <Text
            component={Link}
            to={ROUTES.HIRING_REQUESTS}
            size="sm"
            td="none"
            c={theme.colors.gray[6]}
            onMouseEnter={(event) => {
              event.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.textDecoration = "none";
            }}
          >
            ← Hiring Requests
          </Text>

          <Group justify="space-between" align="flex-start" mt={4} gap="md">
            <Box>
              <Group gap="sm" align="center">
                <Title order={2}>{request.job_title}</Title>
                <HiringRequestStatusBadge status={request.status} />
              </Group>
              <Text size="sm" c={theme.colors.gray[6]} mt={4}>
                {submittedMeta}
              </Text>
            </Box>

            <Group gap="xs">
              {request.status === HiringRequestStatus.PENDING &&
              user?.role !== ROLES.MANAGER ? (
                <Button
                  color="warning"
                  radius="md"
                  onClick={handleTakeInReview}
                >
                  Take in review
                </Button>
              ) : null}

              {isInReview && user?.role !== ROLES.MANAGER ? (
                <CreateJobFromRequestButton
                  size="sm"
                  color="success"
                  radius="md"
                  hiringRequestId={request.id}
                >
                  Create Job
                </CreateJobFromRequestButton>
              ) : null}

              {canReject ? (
                <Button
                  variant="light"
                  color="red"
                  radius="md"
                  onClick={() => openRejectModal(request)}
                >
                  Reject
                </Button>
              ) : null}
            </Group>
          </Group>
        </Box>

        <HiringRequestStatusTimeline status={request.status} />

        <Grid gutter="xl" align="start">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <HiringRequestDetailsCard
              request={request}
              formatDate={formatLongDate}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="xl">
              <InternalNotesCard
                canManageInternalNotes={canManageInternalNotes}
                existingNotes={normalizeHiringRequestNotes(
                  request.notes_for_recruiter,
                )}
                notes={notes}
                onChange={setNotes}
                onSave={() =>
                  handleSaveNotes(canManageInternalNotes, isPending)
                }
                isSaving={isSavingNotes}
                isSaved={isNotesSaved}
                isDisabled={isPending}
              />

              {canManageInternalNotes ? (
                <HiringManagerNotesCard
                  notes={request.hm_notes_for_recruiter}
                  authorName={request.created_by?.name}
                  date={formatLongDate(request.created_at)}
                />
              ) : null}
            </Stack>
          </Grid.Col>
        </Grid>

        <Box w={{ base: "100%", md: "66%" }}>
          <HiringRequestReviewHistory reviews={request.reviews} />
        </Box>
      </Stack>

      <RejectHiringRequestModal
        opened={Boolean(rejectTarget)}
        requestTitle={rejectTarget?.job_title}
        loading={rejecting}
        onClose={closeRejectModal}
        onConfirm={confirmReject}
      />
    </Box>
  );
}
