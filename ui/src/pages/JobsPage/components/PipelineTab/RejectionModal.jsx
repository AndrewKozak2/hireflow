import { useState } from "react";
import {
  Modal,
  Select,
  Textarea,
  TextInput,
  Button,
  Group,
  Stack,
  Text,
  Anchor,
  Box,
  Divider,
  Switch,
  Collapse,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconSparkles } from "@tabler/icons-react";
import { REJECTION_REASONS } from "../../../../utils/rejectionEmailTemplate";
import { ApplicationsService } from "../../../../services/ApplicationsService";

const DEFAULT_SUBJECT = "An update on your application";

const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "warm", label: "Warm" },
  { value: "concise", label: "Concise" },
];

export function RejectionModal({
  opened,
  onClose,
  applicationId,
  onConfirm,
  candidateName = "the candidate",
}) {
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const firstName = candidateName.split(" ")[0] || candidateName;

  const form = useForm({
    initialValues: {
      reason: "",
      personalNote: "",
      sendEmail: true,
      tone: "neutral",
      emailSubject: DEFAULT_SUBJECT,
      emailBody: "",
    },
    validate: {
      reason: (v) => (!v ? "Rejection reason is required" : null),
    },
  });

  const resetModalState = () => {
    form.reset();
    setIsEditingTemplate(false);
    setIsGeneratingDraft(false);
  };

  const getReasonMessage = (reason) =>
    REJECTION_REASONS.find((r) => r.value === reason)?.label || "Other";

  const buildRejectionMessage = (reason, note) => {
    const base = reason ? getReasonMessage(reason) : "";
    const noteText = note?.trim();
    return [base, noteText].filter(Boolean).join("\n\n");
  };

  const handleOpenEditTemplate = () => {
    if (!form.values.emailBody) {
      form.setFieldValue(
        "emailBody",
        buildRejectionMessage(form.values.reason, form.values.personalNote),
      );
    }
    setIsEditingTemplate(true);
  };

  const handleGenerateDraft = async () => {
    const reasonError = form.validateField("reason");
    if (reasonError.hasError || !form.values.reason || !applicationId) {
      return;
    }

    setIsGeneratingDraft(true);

    try {
      const draft = await ApplicationsService.generateRejectionLetterDraft(
        applicationId,
        {
          tone: form.values.tone,
          rejectionReason: form.values.reason,
          rejectionComment: form.values.personalNote?.trim() || undefined,
        },
      );

      form.setFieldValue("emailSubject", draft.subject || DEFAULT_SUBJECT);
      form.setFieldValue("emailBody", draft.body || "");
      setIsEditingTemplate(true);

      notifications.show({
        title: "Draft generated",
        message: "AI rejection letter draft is ready to review.",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to generate rejection letter draft.",
        color: "red",
      });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const submit = () => {
    const { hasErrors } = form.validate();
    if (hasErrors) return;
    const { reason, personalNote, sendEmail, emailSubject, emailBody } =
      form.values;
    const customEmailBody = emailBody?.trim();
    onConfirm({
      reason,
      comment: personalNote,
      sendEmail,
      emailSubject: customEmailBody ? emailSubject : DEFAULT_SUBJECT,
      emailMessage: customEmailBody || undefined,
    });
  };

  const { sendEmail, emailSubject } = form.values;
  const previewSubject = isEditingTemplate ? emailSubject : DEFAULT_SUBJECT;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Reject ${candidateName}`}
      centered
      radius="md"
      size="lg"
      onExitTransitionEnd={resetModalState}
    >
      <Stack gap="md">
        <Select
          label="Rejection reason category"
          placeholder="Select reason"
          data={REJECTION_REASONS}
          {...form.getInputProps("reason")}
          onChange={(value) => {
            form.setFieldValue("reason", value);
          }}
          required
        />

        <Textarea
          label="Personal note (optional)"
          placeholder="Add a personal note to include in the rejection email."
          {...form.getInputProps("personalNote")}
          minRows={3}
          autosize
        />

        <Group gap="sm" align="center">
          <Switch
            aria-label="Send rejection email to candidate"
            {...form.getInputProps("sendEmail", { type: "checkbox" })}
          />
          <Text size="sm">Send rejection email to candidate</Text>
        </Group>

        <Collapse in={sendEmail}>
          <Stack gap={6}>
            <Group justify="space-between" align="center">
              <Text size="sm" fw={500}>
                Email preview
              </Text>
              <Group gap="xs" align="flex-end">
                <Select
                  label="Tone"
                  size="xs"
                  w={130}
                  data={TONE_OPTIONS}
                  allowDeselect={false}
                  {...form.getInputProps("tone")}
                />
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconSparkles size={14} />}
                  onClick={handleGenerateDraft}
                  loading={isGeneratingDraft}
                  disabled={!applicationId}
                >
                  Generate AI draft
                </Button>
                <Anchor
                  size="sm"
                  c="blue"
                  style={{
                    alignItems: "center",
                    cursor: "pointer",
                    display: "inline-flex",
                    height: 30,
                  }}
                  onClick={
                    isEditingTemplate
                      ? () => {
                          form.setFieldValue("emailBody", "");
                          form.setFieldValue("emailSubject", DEFAULT_SUBJECT);
                          setIsEditingTemplate(false);
                        }
                      : handleOpenEditTemplate
                  }
                >
                  {isEditingTemplate ? "Back to preview" : "Change template"}
                </Anchor>
              </Group>
            </Group>

            {isEditingTemplate ? (
              <Stack gap="sm">
                <TextInput
                  label="Subject"
                  {...form.getInputProps("emailSubject")}
                />
                <Textarea
                  label="Email body"
                  {...form.getInputProps("emailBody")}
                  minRows={8}
                  autosize
                />
              </Stack>
            ) : (
              <Box
                p="md"
                style={{
                  border: "1px solid var(--mantine-color-gray-3)",
                  borderRadius: "var(--mantine-radius-sm)",
                  backgroundColor: "#fff",
                }}
              >
                <Stack gap="xs">
                  <Text size="sm">
                    <Text span fw={600} size="sm">
                      Subject:
                    </Text>{" "}
                    {previewSubject}
                  </Text>

                  <Divider />

                  <Stack gap={6}>
                    <Text size="sm">Dear {firstName},</Text>
                    <Text size="sm">
                      Thank you for taking the time to apply for this position.
                      We genuinely appreciate your interest and the effort you
                      put into your application.
                    </Text>
                    <Text size="sm">
                      After careful review, we regret to inform you that we will
                      not be moving forward with your application at this time.
                    </Text>
                    <Text size="sm">
                      We encourage you to continue exploring other opportunities
                      that may be a great fit for your skills and experience. We
                      wish you all the best in your job search.
                    </Text>
                    <Text size="sm">
                      Best regards,
                      <br />
                      <strong>The HireFlow Team</strong>
                    </Text>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Stack>
        </Collapse>

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button color="red" onClick={submit}>
            Reject Candidate
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
