import {
  Select,
  Textarea,
  Checkbox,
  Stack,
  Group,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";

export function DeclineOfferModal({ onSubmit, onCancel }) {
  const form = useForm({
    initialValues: {
      reason: "",
      note: "",
      sendEmail: false,
    },
    validate: {
      reason: (value) => (!value ? "Reason is required" : null),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Select
          label="Reason category"
          placeholder="Select reason"
          data={[
            { value: "SALARY", label: "Salary expectations" },
            { value: "COMPETITOR_OFFER", label: "Accepted another offer" },
            { value: "PERSONAL", label: "Personal reasons" },
            { value: "LOCATION", label: "Location/Remote preference" },
            { value: "OTHER", label: "Other" },
          ]}
          {...form.getInputProps("reason")}
        />

        <Textarea
          label="Optional note"
          placeholder="Add internal details..."
          {...form.getInputProps("note")}
        />

        <Checkbox
          label="Send rejection email to candidate"
          {...form.getInputProps("sendEmail", { type: "checkbox" })}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button color="red" type="submit">
            Confirm Decline
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
