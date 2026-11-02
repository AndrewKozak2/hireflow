import {
  Modal,
  Select,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Checkbox,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRef, useState } from "react";
import { IconSend } from "@tabler/icons-react";
import { useAuthStore } from "../../../../stores/useAuthStore";

const CALENDLY_LINK = "https://calendly.com/oihnatova/intercode-pre-interview";

const EMAIL_TEMPLATES = [
  {
    group: "Shared",
    items: [
      { value: "screening_invitation", label: "Screening invitation" },
      { value: "rejection_generic", label: "Rejection — generic" },
    ],
  },
  {
    group: "My templates",
    items: [{ value: "friendly_screening", label: "Friendly screening intro" }],
  },
];

const buildTemplateContent = (
  templateId,
  { firstName, jobTitle, senderName },
) => {
  switch (templateId) {
    case "screening_invitation":
      return {
        subject: `Quick chat about ${jobTitle} at HireFlow?`,
        body:
          `Hi ${firstName} 👋\n\n` +
          `Thanks for applying to the ${jobTitle} role at HireFlow. ` +
          `We'd love to chat — could you book a 30-min slot here?\n\n` +
          `{{calendly_link}}\n\n` +
          `Looking forward!\n${senderName}`,
      };
    case "rejection_generic":
      return {
        subject: `An update on your application`,
        body:
          `Hi ${firstName},\n\n` +
          `Thank you for taking the time to apply for the ${jobTitle} position at HireFlow.\n\n` +
          `After careful consideration, we've decided to move forward with other candidates at this time.\n\n` +
          `We appreciate your interest and wish you the best in your search.\n\n` +
          `Best regards,\n${senderName}`,
      };
    case "friendly_screening":
      return {
        subject: `Quick chat about ${jobTitle}?`,
        body:
          `Hey ${firstName}! 👋\n\n` +
          `Loved your application for the ${jobTitle} role. ` +
          `We'd love to have a quick chat — does any slot here work for you?\n\n` +
          `{{calendly_link}}\n\n` +
          `Looking forward,\n${senderName}`,
      };
    default:
      return { subject: "", body: "" };
  }
};

const applyCalendly = (rawBody, include) => {
  if (include) {
    return rawBody.replace(/\{\{calendly_link\}\}/g, CALENDLY_LINK);
  }
  return rawBody.replace(/\{\{calendly_link\}\}\n?/g, "");
};

export function SendEmailModal({
  opened,
  onClose,
  onSend,
  candidateEmail = "",
  candidateName = "there",
  jobTitle = "the position",
  isSending = false,
}) {
  const user = useAuthStore((s) => s.user);
  const senderName = user?.name || "The HireFlow Team";
  const firstName = candidateName.split(" ")[0] || candidateName;

  const defaultTemplate = buildTemplateContent("friendly_screening", {
    firstName,
    jobTitle,
    senderName,
  });

  const rawBodyRef = useRef(defaultTemplate.body);
  const [bodyHasCalendly, setBodyHasCalendly] = useState(true);

  const form = useForm({
    initialValues: {
      to: candidateEmail,
      templateId: "friendly_screening",
      subject: defaultTemplate.subject,
      body: applyCalendly(defaultTemplate.body, true),
      includeCalendly: true,
    },
    validate: {
      to: (v) => (!v ? "Recipient email is required" : null),
      subject: (v) => (!v ? "Subject is required" : null),
      body: (v) => (!v ? "Body is required" : null),
    },
  });

  const handleTemplateChange = (templateId) => {
    form.setFieldValue("templateId", templateId);
    if (!templateId) return;
    const { subject, body } = buildTemplateContent(templateId, {
      firstName,
      jobTitle,
      senderName,
    });
    rawBodyRef.current = body;
    const hasCalendly = body.includes("{{calendly_link}}");
    setBodyHasCalendly(hasCalendly);
    form.setFieldValue("subject", subject);
    form.setFieldValue("includeCalendly", hasCalendly);
    form.setFieldValue("body", applyCalendly(body, hasCalendly));
  };

  const handleIncludeCalendlyChange = (checked) => {
    form.setFieldValue("includeCalendly", checked);
    form.setFieldValue("body", applyCalendly(rawBodyRef.current, checked));
  };

  const handleClose = () => {
    form.reset();
    rawBodyRef.current = defaultTemplate.body;
    setBodyHasCalendly(true);
    onClose();
  };

  const submit = () => {
    const result = form.validate();
    if (result.hasErrors) return;
    const { to, subject, body } = form.values;
    onSend({ to, subject, body });
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Send email"
      centered
      radius="md"
      size="lg"
      styles={{
        content: {
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
        },
        body: { flex: 1, overflowY: "auto" },
      }}
    >
      <Stack gap="md">
        <TextInput
          label="To"
          placeholder="candidate@email.com"
          {...form.getInputProps("to")}
        />

        <Select
          label="Template"
          placeholder="Select a template"
          data={EMAIL_TEMPLATES}
          value={form.values.templateId}
          onChange={handleTemplateChange}
          clearable
        />

        <TextInput
          label="Subject"
          placeholder="Email subject"
          {...form.getInputProps("subject")}
        />

        <Textarea
          label="Body"
          placeholder="Email body"
          {...form.getInputProps("body")}
          onChange={(e) => {
            const value = e.currentTarget.value;
            form.setFieldValue("body", value);
            form.clearFieldError("body");
            rawBodyRef.current = form.values.includeCalendly
              ? value.replace(CALENDLY_LINK, "{{calendly_link}}")
              : value;
          }}
          minRows={8}
          autosize
          styles={{ input: { whiteSpace: "pre-wrap" } }}
        />

        {bodyHasCalendly && (
          <Checkbox
            label="Include my Calendly link"
            checked={form.values.includeCalendly}
            onChange={(e) =>
              handleIncludeCalendlyChange(e.currentTarget.checked)
            }
          />
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconSend size={16} />}
            onClick={submit}
            loading={isSending}
          >
            Send
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
