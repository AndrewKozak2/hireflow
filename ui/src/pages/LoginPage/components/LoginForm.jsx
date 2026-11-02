import {
  Button,
  PasswordInput,
  Text,
  TextInput,
  Anchor,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes/routes";
import { useAuth } from "../../../hooks/useAuth";
import { em } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

export const LoginForm = () => {
  const isMobile = useMediaQuery(`(max-width: ${em(1200)})`);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) =>
        val.length < 6 ? "Password should include at least 6 characters" : null,
    },
  });

  const handleSubmit = async (values) => {
    try {
      setServerError("");
      setLoading(true);

      await login(values);

      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "Login failed";
      setServerError(message);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={form.onSubmit(handleSubmit)}
      style={isMobile ? { width: "90vw" } : { width: "30vw" }}
    >
      <TextInput
        required
        label="Email address"
        placeholder="hello@gmail.com"
        value={form.values.email}
        onChange={(event) =>
          form.setFieldValue("email", event.currentTarget.value)
        }
        error={form.errors.email && "Invalid email"}
        size="md"
        radius="md"
        styles={{
          label: {
            margin: "10px 0",
          },
        }}
      />

      <PasswordInput
        required
        label="Password"
        placeholder="Your password"
        value={form.values.password}
        onChange={(event) =>
          form.setFieldValue("password", event.currentTarget.value)
        }
        error={
          form.errors.password &&
          "Password should include at least 6 characters"
        }
        mt="xs"
        size="md"
        radius="md"
        styles={{
          label: {
            marginBottom: "10px",
          },
        }}
      />

      <Text c="red" size="sm" mt="md" mih={30}>
        {serverError}
      </Text>

      <Group justify="flex-end">
        <Anchor
          component="button"
          type="button"
          size="sm"
          onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
        >
          Forgot password?
        </Anchor>
      </Group>

      <Button
        type="submit"
        fullWidth
        size="md"
        radius="md"
        loading={loading}
        mt="sm"
      >
        Login
      </Button>
    </form>
  );
};
