import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes/routes";
import { TextInput, PasswordInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNotifications } from "../../../hooks/useNotifications";
import { useAuth } from "../../../hooks/useAuth";
import { ROLES } from "../../../constants/roles";

export default function AcceptInviteForm({ token, inviteData }) {
  const { onSuccess, onError } = useNotifications();
  const { acceptInvite } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      fullName: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      fullName: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      password: (value) =>
        value.length < 8 ? "Password must be at least 8 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await acceptInvite({
        token,
        name: values.fullName,
        password: values.password,
      });

      onSuccess({ message: "Account created successfully!" });

      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      onError({
        message: error.response?.data?.message || "Something went wrong",
      });
      setIsSubmitting(false);
    }
  };

  const roleDisplayName = inviteData?.role
    ? ROLES[inviteData.role.toUpperCase()] || inviteData.role
    : "";

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput
          label="Full Name"
          placeholder="Your name"
          required
          {...form.getInputProps("fullName")}
        />
        <PasswordInput
          label="Password"
          placeholder="Minimum 8 characters"
          required
          {...form.getInputProps("password")}
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="Repeat your password"
          required
          {...form.getInputProps("confirmPassword")}
        />
        <Button type="submit" fullWidth mt="md" loading={isSubmitting}>
          Join as {roleDisplayName}
        </Button>
      </Stack>
    </form>
  );
}
