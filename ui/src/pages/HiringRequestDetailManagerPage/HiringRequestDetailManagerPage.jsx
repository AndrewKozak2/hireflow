import {
  Anchor,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Stepper,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import {
  REQUEST_STATUS_COLOR,
  REQUEST_STATUS_LABEL,
} from "../../constants/hiringRequestConstants";
import { ROUTES } from "../../routes/routes";
import { PageLoader } from "../../components/PageLoader/PageLoader";
import { useHiringRequestDetail } from "../HiringRequestsPage/hooks/useHiringRequestDetail";
import { HiringRequestForm } from "../HiringRequestsPage/form/HiringRequestForm";
import { HiringRequestReviewHistory } from "../HiringRequestsPage/components/HiringRequestReviewHistory";

export default function HiringRequestDetailManagerPage() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const {
    request,
    loading,
    editing,
    setEditing,
    saving,
    resubmitting,
    cancelling,
    submittingDraft,
    managers,
    form,
    today,
    onSubmit,
    onResubmit,
    handleCancel,
    handleSubmitDraft,
    discardEdit,
    goBack,
    goToJob,
    isDraft,
    isPending,
    isApproved,
    isRejected,
    activeStep,
    isCancelled,
    hasChanges,
  } = useHiringRequestDetail();

  if (loading) return <PageLoader />;
  if (!request) return null;

  return (
    <>
      <Anchor component="button" size="sm" c="dimmed" mb="md" onClick={goBack}>
        ← Hiring Requests
      </Anchor>

      <Flex justify="space-between" align="flex-start" mb="lg">
        <div>
          <Title order={2}>{request.job_title || request.role_purpose}</Title>
          <Text c="dimmed" size="sm">
            {request.location} · {request.employment_type}
          </Text>
        </div>
        <Badge
          color={REQUEST_STATUS_COLOR[request.status] ?? "gray"}
          size="lg"
          variant="light"
        >
          {REQUEST_STATUS_LABEL[request.status] ?? request.status}
        </Badge>
      </Flex>

      {!isCancelled && !isDraft && (
        <>
          <Divider mt="xl" mb="xs" />
          <Title order={5} mb="sm">
            Status timeline
          </Title>
          <Stepper active={activeStep} mb="xl" size="sm" color="blue">
            <Stepper.Step label="Submitted" />
            <Stepper.Step label="In Review" />
            <Stepper.Step
              label={isRejected ? "Rejected" : "Approved"}
              color={isRejected ? "red" : "green"}
              icon={
                isRejected ? (
                  <IconX size={16} color={theme.colors.red[6]} />
                ) : undefined
              }
            />
          </Stepper>
        </>
      )}

      {isApproved && request.jobId && (
        <Anchor
          component="button"
          fw={500}
          mb="xl"
          onClick={() => goToJob(request.jobId)}
        >
          View vacancy →
        </Anchor>
      )}

      <HiringRequestForm
        mode={editing ? "edit" : "view"}
        form={form}
        managers={managers}
        today={today}
        saving={isRejected ? resubmitting : saving}
        onSubmit={isRejected ? onResubmit : onSubmit}
        onDiscard={discardEdit}
        submitLabel={isRejected ? "Resubmit" : "Save changes"}
        isSubmitDisabled={isRejected && !hasChanges}
      />

      {isDraft && (
        <Flex justify="flex-end" gap="sm" mt="xl">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                ROUTES.HIRING_REQUESTS_DRAFT_EDIT.replace(":id", request.id),
              )
            }
          >
            Edit Draft
          </Button>
          <Button loading={submittingDraft} onClick={handleSubmitDraft}>
            Submit for Review
          </Button>
        </Flex>
      )}

      {(isPending || isRejected) && !editing && (
        <Flex justify="flex-end" gap="sm" mt="xl">
          {isPending ? (
            <Button
              variant="outline"
              color="red"
              loading={cancelling}
              onClick={handleCancel}
            >
              Cancel Request
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </Flex>
      )}

      <Divider mt="xl" mb="md" />
      <Box w={{ base: "100%", md: "66%" }}>
        <HiringRequestReviewHistory reviews={request.reviews} />
      </Box>
    </>
  );
}
