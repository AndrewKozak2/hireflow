import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PasswordInput, Button, Flex, Title, Text, em } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { AuthService } from "../../services/AuthService";
import { useNotifications } from "../../hooks/useNotifications";
import { ROUTES } from "../../routes/routes";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [status, setStatus] = useState("idle");
  const { onError, onSuccess } = useNotifications();
  const isMobile = useMediaQuery(`(max-width: ${em(1200)})`);

  useEffect(() => {
    if (!token) {
      onError({ message: "Invalid or expired reset token" });
    }
  }, [token, onError]);

  const form = useForm({
    initialValues: { password: "", confirm: "" },
    validate: {
      password: (val) =>
        val.length >= 8 ? null : "Password must be at least 8 characters",
      confirm: (val, values) =>
        val === values.password ? null : "Passwords do not match",
    },
  });

  const handleSubmit = async (values) => {
    if (!token) {
      onError({ message: "Invalid or expired reset token" });
      return;
    }
    try {
      setStatus("loading");
      await AuthService.resetPassword(token, values.password);
      onSuccess({
        message: "Password updated successfully. Please log in.",
      });
      navigate(ROUTES.LOGIN);
    } catch (err) {
      onError({ message: err.message || "Something went wrong" });
      setStatus("idle");
    }
  };

  return (
    <Flex direction="column" justify="center" align="center" h="100vh">
      <Title order={2} mb={4}>
        Set new password
      </Title>
      <Text
        c="dimmed"
        size="sm"
        ta="center"
        mb="xl"
        style={isMobile ? { width: "90vw" } : { width: "30vw" }}
      >
        Choose a strong password of at least 8 characters
      </Text>

      <form
        onSubmit={form.onSubmit(handleSubmit)}
        style={isMobile ? { width: "90vw" } : { width: "30vw" }}
      >
        <PasswordInput
          label="New password"
          placeholder="Min 8 characters"
          size="md"
          radius="md"
          disabled={!token}
          styles={{ label: { margin: "10px 0" } }}
          {...form.getInputProps("password")}
        />

        <PasswordInput
          label="Confirm password"
          placeholder="Repeat your password"
          size="md"
          radius="md"
          disabled={!token}
          mt="xs"
          styles={{ label: { marginBottom: "10px" } }}
          {...form.getInputProps("confirm")}
        />

        <Button
          type="submit"
          fullWidth
          size="md"
          radius="md"
          mt="sm"
          loading={status === "loading"}
          disabled={!token}
        >
          Update password
        </Button>
      </form>
    </Flex>
  );
}
