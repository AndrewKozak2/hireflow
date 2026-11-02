import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  Anchor,
  Alert,
  Box,
  Button,
  Center,
  Flex,
  Group,
  Text,
  TextInput,
  Title,
  em,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { AuthService } from "../../services/AuthService";
import { ROUTES } from "../../routes/routes";

export default function ForgotPassword() {
  const [status, setStatus] = useState("idle");
  const navigate = useNavigate();
  const isMobile = useMediaQuery(`(max-width: ${em(1200)})`);

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (val) =>
        /^\S+@\S+\.\S+$/.test(val) ? null : "Enter a valid email address",
    },
  });

  const handleSubmit = async (values) => {
    try {
      setStatus("loading");
      await AuthService.forgotPassword(values.email);
      setStatus("success");
    } catch (error) {
      console.error("Forgot password error:", error);
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <Flex direction="column" justify="center" align="center" h="100vh">
        <Alert
          color="green"
          title="Check your email"
          radius="md"
          style={isMobile ? { width: "90vw" } : { width: "30vw" }}
        >
          We sent a password reset link to your email address.
        </Alert>
      </Flex>
    );
  }

  return (
    <Flex direction="column" justify="center" align="center" h="100vh">
      <Title order={2} mb={4}>
        Forgot your password?
      </Title>
      <Text
        c="dimmed"
        size="sm"
        ta="center"
        mb="xl"
        style={isMobile ? { width: "90vw" } : { width: "30vw" }}
      >
        Enter your email to get a reset link
      </Text>

      <form
        onSubmit={form.onSubmit(handleSubmit)}
        style={isMobile ? { width: "90vw" } : { width: "30vw" }}
      >
        <TextInput
          label="Your email"
          placeholder="hello@gmail.com"
          size="md"
          radius="md"
          styles={{ label: { margin: "10px 0" } }}
          {...form.getInputProps("email")}
        />

        <Group justify="space-between" mt="lg">
          <Anchor
            c="dimmed"
            size="sm"
            onClick={() => navigate(ROUTES.LOGIN)}
            style={{ cursor: "pointer" }}
          >
            <Center inline>
              <IconArrowLeft size={12} stroke={1.5} />
              <Box ml={5}>Back to login</Box>
            </Center>
          </Anchor>
          <Button
            type="submit"
            size="md"
            radius="md"
            loading={status === "loading"}
          >
            Reset password
          </Button>
        </Group>
      </form>
    </Flex>
  );
}
