import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Button,
  Paper,
  Title,
  Container,
  Loader,
  Alert,
  Center,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { AuthService } from "../../services/AuthService";
import AcceptInviteForm from "./components/AcceptInviteForm";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState(null);
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenError("Invalid or expired invitation link.");
        setIsValidating(false);
        return;
      }

      try {
        const data = await AuthService.checkInviteToken(token);
        setInviteData(data);
        setIsValidating(false);
      } catch {
        setTokenError("Invalid or expired invitation link.");
        setIsValidating(false);
      }
    };

    checkToken();
  }, [token]);

  if (isValidating) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (tokenError) {
    return (
      <Container size={420} my={80}>
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Invitation Error"
          color="red"
          variant="filled"
        >
          {tokenError}
        </Alert>
        <Button fullWidth mt="md" variant="light" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container size={420} my={80}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} ta="center" mb="sm">
          HireFlow
        </Title>
        <Title order={5} ta="center" c="dimmed" mb="lg">
          Completing registration for {inviteData?.email}
        </Title>
        <AcceptInviteForm token={token} inviteData={inviteData} />
      </Paper>
    </Container>
  );
}
