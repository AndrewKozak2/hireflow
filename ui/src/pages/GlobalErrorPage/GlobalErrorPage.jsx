import { Title, Text, Button, Container, Group, Stack } from "@mantine/core";
import classes from "./GlobalErrorPage.module.css";

export const GlobalErrorPage = () => {
  return (
    <div className={classes.pageWrapper}>
      <Container py="xl">
        <Stack align="center" gap="xl">
          <div className={classes.eyesContainer}>
            <div className={classes.eyeWrapper}>
              <div className={classes.eyeShapeLeft}>
                <div className={classes.wrinkle}></div>
              </div>
              <div className={classes.deadPupil} />
            </div>
            <div className={classes.eyeWrapper}>
              <div className={classes.eyeShapeRight}>
                <div className={classes.wrinkle}></div>
              </div>
              <div className={classes.deadPupil} />
            </div>
          </div>
          <Title order={1} c="dimmed" className={classes.label}>
            500
          </Title>

          <Title order={2} ta="center" c="dimmed">
            Something went wrong...
          </Title>

          <Text c="dimmed" size="lg" ta="center" maw={500}>
            A critical error has occurred on the server or in the application.
            We have already received a report of the problem.
          </Text>

          <Group justify="center">
            <Button
              variant="light"
              size="sm"
              radius="xl"
              color="dark"
              onClick={() => window.location.assign("/")}
            >
              Return to home page
            </Button>
            <Button
              variant="filled"
              color="dark"
              size="sm"
              radius="xl"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </Button>
          </Group>
        </Stack>
      </Container>
    </div>
  );
};
