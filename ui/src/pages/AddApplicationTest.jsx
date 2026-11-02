import { useDisclosure } from "@mantine/hooks";
import { Button, Container, Title, Stack } from "@mantine/core";
import { AddApplicationDrawer } from "../components/AddApplicationDrawer/AddApplicationDrawer";
import { useLocation } from "react-router-dom";

export default function AddApplicationTestPage() {
  const [opened, { open, close }] = useDisclosure(true);
  const location = useLocation();
  const { jobId, candidateId } = location.state || {};

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xl">
        <Title order={2}>Create New Application</Title>
        <Button onClick={open} size="lg" variant="light">
          Configure Form
        </Button>
      </Stack>

      <AddApplicationDrawer
        opened={opened}
        onClose={close}
        initialJobId={jobId}
        initialCandidateId={candidateId}
      />
    </Container>
  );
}
