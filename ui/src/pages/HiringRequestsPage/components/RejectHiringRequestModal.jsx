import { Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";

export function RejectHiringRequestModal({
  opened,
  requestTitle,
  loading,
  onClose,
  onConfirm,
}) {
  const form = useForm({
    initialValues: {
      reason: "",
    },
    validate: {
      reason: (value) =>
        value.trim().length >= 10
          ? null
          : "Reason must be at least 10 characters",
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = form.onSubmit(async ({ reason }) => {
    await onConfirm(reason.trim());
    form.reset();
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Reject hiring request"
      centered
      radius="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Add a clear reason so the hiring manager can update and resubmit
            {requestTitle ? ` "${requestTitle}"` : " this request"}.
          </Text>

          <Textarea
            label="Rejection reason"
            placeholder="Explain what should be changed before resubmission"
            minRows={4}
            autosize
            withAsterisk
            disabled={loading}
            {...form.getInputProps("reason")}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" color="red" loading={loading}>
              Reject Request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
