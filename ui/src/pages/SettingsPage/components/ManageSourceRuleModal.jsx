import { useState } from "react";
import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

export function ManageSourceRuleModal({
  opened,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      sender_pattern: initialData?.sender_pattern ?? "",
      source_label: initialData?.source_label ?? "",
    },
    validate: {
      sender_pattern: (value) => {
        if (!value || value.trim().length === 0)
          return "Sender pattern is required";
        if (!value.includes("@") && !value.includes("*"))
          return "Pattern should contain a wildcard (*) or domain (@)";
        return null;
      },
      source_label: (value) =>
        !value || value.trim().length === 0 ? "Source label is required" : null,
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={initialData ? "Edit rule" : "Add rule"}
      trapFocus
      keepMounted={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Sender Pattern"
          placeholder="*@domain.com"
          required
          {...form.getInputProps("sender_pattern")}
          data-autofocus
        />
        <TextInput
          label="Source Label"
          placeholder="Djinni"
          mt="md"
          required
          {...form.getInputProps("source_label")}
        />
        <Group justify="flex-end" mt="xl">
          <Button
            variant="subtle"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            type="submit"
            loading={isSubmitting}
            disabled={!form.isDirty()}
          >
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
