import { useState } from "react";
import { useForm } from "@mantine/form";
import { TextInput, Button, Stack, Alert, Box, Group } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { CandidatesService } from "../services/CandidatesService";
import { useNotifications } from "../hooks/useNotifications";

export default function CandidateForm({
  initialValues,
  onSuccess,
  mode = "create",
}) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const { onSuccess: notifySuccess } = useNotifications();

  const form = useForm({
    initialValues: {
      firstName: initialValues?.firstName || "",
      lastName: initialValues?.lastName || "",
      email: initialValues?.email || "",
      phone: initialValues?.phone || "",
      linkedinUrl: initialValues?.linkedinUrl || "",
    },

    validate: {
      firstName: (val) => (val.length < 1 ? "First name is required" : null),
      lastName: (val) => (val.length < 1 ? "Last name is required" : null),
      email: (val) =>
        /^\S+@\S+\.\S+$/.test(val) ? null : "Invalid email format",
      phone: (val) =>
        val && !/^\+?[\d\s-()]{7,20}$/.test(val)
          ? "Invalid phone number format"
          : null,
      linkedinUrl: (val) =>
        val && !/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/.test(val)
          ? "Invalid LinkedIn URL"
          : null,
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setServerError(null);
    try {
      let result;
      if (mode === "create") {
        result = await CandidatesService.createCandidate(values);
        notifySuccess({ message: "Candidate created successfully" });
      } else {
        result = await CandidatesService.updateCandidate(
          initialValues.id,
          values,
        );
        notifySuccess({ message: "Candidate updated successfully" });
      }
      if (onSuccess) onSuccess(result);
    } catch (error) {
      if (error.response?.status === 409) {
        form.setFieldError(
          "email",
          "A candidate with this email already exists.",
        );
      } else {
        setServerError(
          error.response?.data?.message || "An unexpected error occurred",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maw={500} mx="auto">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {serverError && (
            <Alert
              icon={<IconInfoCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {serverError}
            </Alert>
          )}
          <Group>
            <TextInput
              label="First Name"
              placeholder="John"
              required
              {...form.getInputProps("firstName")}
            />

            <TextInput
              label="Last Name"
              placeholder="Doe"
              required
              {...form.getInputProps("lastName")}
            />
          </Group>
          <TextInput
            label="Email"
            placeholder="john.doe@example.com"
            required
            {...form.getInputProps("email")}
          />

          <TextInput
            label="Phone"
            placeholder="+380..."
            {...form.getInputProps("phone")}
          />

          <TextInput
            label="LinkedIn URL"
            required
            placeholder="https://linkedin.com/in/username"
            {...form.getInputProps("linkedinUrl")}
          />

          <Button
            type="submit"
            loading={loading}
            disabled={!form.isValid()}
            mt="md"
          >
            {mode === "create" ? "Create Candidate" : "Save Changes"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
