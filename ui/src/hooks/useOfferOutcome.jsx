import { useState } from "react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { JobsService } from "../services/JobsService";
import { ApplicationsService } from "../services/ApplicationsService";
import {
  Text,
  Select,
  TextInput,
  Checkbox,
  Button,
  Stack,
  Group,
} from "@mantine/core";

export function useOfferOutcome(application, onUpdate, onOpenHireModal) {
  const [isLoading, setIsLoading] = useState(false);

  const openJobCloseModal = (jobId, count) => {
    const isZeroRemaining = count === 0;

    modals.open({
      modalId: "job-close-modal",
      title: (
        <Text fw={700} size="lg">
          Close this job?
        </Text>
      ),
      closeOnClickOutside: false,
      withCloseButton: false,
      children: (
        <Stack gap="md" pt="xs">
          <Text size="sm">
            {isZeroRemaining
              ? "All applications have been resolved."
              : `${count} applications still in the pipeline.`}
          </Text>

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="gray"
              onClick={() => {
                modals.closeAll();
                onUpdate?.();
              }}
            >
              Keep open
            </Button>
            <Button
              color="blue"
              onClick={async () => {
                try {
                  await JobsService.closeJob(jobId);
                  notifications.show({
                    title: "Success",
                    message: "Job closed",
                    color: "green",
                  });
                } catch {
                  notifications.show({
                    title: "Error",
                    message: "Failed to close job",
                    color: "red",
                  });
                } finally {
                  modals.closeAll();
                  onUpdate?.();
                }
              }}
            >
              Close job
            </Button>
          </Group>
        </Stack>
      ),
    });
  };

  const handleAccept = () => {
    if (!application) return;
    // Delegate to the hire confirmation modal opened by the parent
    onOpenHireModal?.();
  };

  const handleDecline = () => {
    if (!application) return;

    modals.open({
      modalId: "decline-modal",
      title: (
        <Text fw={700} size="lg">
          Reject Application
        </Text>
      ),
      children: (
        <DeclineFormModal application={application} onUpdate={onUpdate} />
      ),
    });
  };

  return { handleAccept, handleDecline, isLoading };
}
function DeclineFormModal({ application, onUpdate }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      notifications.show({
        title: "Error",
        message: "Please select a reason",
        color: "red",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reason: reason,
        note: note.trim() || undefined,
        sendEmail: sendEmail,
      };

      await ApplicationsService.declineOffer(application.id, payload);

      notifications.show({
        title: "Application Rejected",
        message: "The application stage has been updated to rejected.",
        color: "gray",
      });

      onUpdate?.();
      modals.closeAll();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.message || "Failed to decline offer",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="md" pt="sm">
      <Select
        label="Reason category"
        placeholder="Pick one"
        required
        data={[
          {
            value: "salary_expectations",
            label: "Salary expectations mismatch",
          },
          { value: "other", label: "Accepted counter offer" },
          { value: "not_culture_fit", label: "Culture fit" },
          { value: "no_response", label: "Candidate went ghosting" },
        ]}
        value={reason}
        onChange={setReason}
      />

      <TextInput
        label="Optional note"
        placeholder="Add details here..."
        value={note}
        onChange={(event) => setNote(event.currentTarget.value)}
      />

      <Checkbox
        label="Send rejection email to candidate"
        checked={sendEmail}
        onChange={(event) => setSendEmail(event.currentTarget.checked)}
      />

      <Button
        color="red"
        fullWidth
        onClick={handleSubmit}
        loading={submitting}
        mt="xs"
      >
        Confirm Rejection
      </Button>
    </Stack>
  );
}
