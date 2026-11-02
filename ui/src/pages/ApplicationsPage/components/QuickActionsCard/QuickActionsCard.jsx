import { useState } from "react";
import { Button, Card, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMail } from "@tabler/icons-react";
import { useOfferOutcome } from "../../../../hooks/useOfferOutcome";
import { ApplicationsService } from "../../../../services/ApplicationsService";
import { RejectionModal } from "../../../JobsPage/components/PipelineTab/RejectionModal";
import { HireConfirmationModal } from "../../../JobsPage/components/PipelineTab/HireConfirmationModal";
import { SendEmailModal } from "../SendEmailModal/SendEmailModal";

const NEXT_STAGE = {
  new: { stage: "screening", label: "Move to Screening" },
  screening: { stage: "pre_interview", label: "Move to Pre-interview" },
  pre_interview: {
    stage: "technical_interview",
    label: "Move to Technical Interview",
  },
  technical_interview: { stage: "offer", label: "Move to Offer" },
};

export function QuickActionsCard({ application, onRefresh }) {
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { handleAccept, isLoading: isAccepting } = useOfferOutcome(
    application,
    onRefresh,
    () => setHireModalOpen(true),
  );

  const currentStage = application?.stage;
  const next = currentStage ? NEXT_STAGE[currentStage] : null;
  const isOffer = currentStage === "offer";
  const isTerminal = currentStage === "hired" || currentStage === "rejected";

  const handleMoveStage = async () => {
    if (!application?.id || !next) return;
    try {
      await ApplicationsService.changeStage(application.id, next.stage);
      onRefresh?.();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to move application stage",
        color: "red",
      });
    }
  };

  const handleSendEmail = async ({ to, subject, body }) => {
    if (!application?.id) return;
    setIsSending(true);
    try {
      await ApplicationsService.sendEmail(application.id, {
        to,
        subject,
        body,
      });
      setSendEmailModalOpen(false);
      notifications.show({
        title: "Email sent",
        message: `Email sent to ${to}`,
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to send email",
        color: "red",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRejectConfirm = async ({
    reason,
    comment,
    emailMessage,
    sendEmail,
    emailSubject,
  }) => {
    if (!application?.id) return;
    try {
      await ApplicationsService.changeStage(
        application.id,
        "rejected",
        reason,
        comment,
        emailMessage,
        sendEmail,
        emailSubject,
      );
      setRejectionModalOpen(false);
      onRefresh?.();
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to reject application",
        color: "red",
      });
    }
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts={0.5}>
          Quick Actions
        </Text>

        <Stack gap="sm">
          {!isTerminal && next && (
            <Button fullWidth color="blue" onClick={handleMoveStage}>
              {next.label}
            </Button>
          )}

          {isOffer && (
            <Button
              fullWidth
              color="green"
              onClick={handleAccept}
              loading={isAccepting}
            >
              Accept Offer
            </Button>
          )}

          <Button
            fullWidth
            variant="default"
            leftSection={<IconMail size={16} />}
            onClick={() => setSendEmailModalOpen(true)}
          >
            Send email
          </Button>

          {!isTerminal && (
            <Button
              fullWidth
              variant="subtle"
              color="red"
              onClick={() => setRejectionModalOpen(true)}
            >
              Reject
            </Button>
          )}
        </Stack>
      </Stack>

      <RejectionModal
        opened={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        applicationId={application?.id}
        onConfirm={handleRejectConfirm}
        candidateName={
          [application?.candidate?.firstName, application?.candidate?.lastName]
            .filter(Boolean)
            .join(" ") || "the candidate"
        }
        jobTitle={application?.job?.title || "the position"}
      />

      <HireConfirmationModal
        opened={hireModalOpen}
        onClose={() => setHireModalOpen(false)}
        application={application}
        onSuccess={() => {
          setHireModalOpen(false);
          onRefresh?.();
        }}
      />

      <SendEmailModal
        key={application?.id}
        opened={sendEmailModalOpen}
        onClose={() => setSendEmailModalOpen(false)}
        onSend={handleSendEmail}
        candidateEmail={application?.candidate?.email || ""}
        candidateName={
          [application?.candidate?.firstName, application?.candidate?.lastName]
            .filter(Boolean)
            .join(" ") || "the candidate"
        }
        jobTitle={application?.job?.title || "the position"}
        isSending={isSending}
      />
    </Card>
  );
}
