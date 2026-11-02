import { Title, Text, Button, Container, Group, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import classes from "./UnauthorizedPage.module.css";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className={classes.root}>
      <Container size="md">
        <Stack align="center">
          <div className={classes.errorLabel}>403</div>

          <Title className={classes.title} order={2}>
            Access Denied
          </Title>

          <Text
            c="dimmed"
            size="lg"
            ta="center"
            className={classes.description}
          >
            You do not have permission to view this page.
          </Text>
          <Group justify="center">
            <Button variant="light" size="md" onClick={() => navigate("/")}>
              Back to Dashboard
            </Button>
          </Group>
        </Stack>
      </Container>
    </div>
  );
}
