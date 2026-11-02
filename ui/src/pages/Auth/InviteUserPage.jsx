import { Paper, Title, Container } from "@mantine/core";
import InviteUserForm from "./components/InviteUserForm";

export default function InviteUserPage() {
  return (
    <Container size={420} my={80}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} ta="center" mb="lg">
          Invite New Team Member
        </Title>
        <InviteUserForm />
      </Paper>
    </Container>
  );
}
