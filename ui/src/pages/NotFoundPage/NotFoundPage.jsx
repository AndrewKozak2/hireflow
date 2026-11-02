import { useState, useEffect } from "react";
import { Title, Text, Button, Container, Group, Stack } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/routes";
import classes from "./NotFoundPage.module.css";

export function NotFoundPage() {
  const [textIndex, setTextIndex] = useState(0);
  const [posIndex, setPosIndex] = useState(0);
  const navigate = useNavigate();
  const phrases = ["Got lost?", "Why?", "How...?"];

  const eyePositions = [
    { x: -20, y: 0 },
    { x: 20, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 20 },
    { x: 0, y: -20 },
    { x: 0, y: 0 },
  ];

  useEffect(() => {
    const eyeInterval = setInterval(() => {
      setPosIndex((prevIndex) => {
        return (prevIndex + 1) % eyePositions.length;
      });
    }, 800);
    return () => clearInterval(eyeInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => {
        return (prevIndex + 1) % phrases.length;
      });
    }, 1500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={classes.pageWrapper}>
      <Container py="xl">
        <Stack align="center" gap="xl">
          <div
            className={classes.eyesContainer}
            style={{
              "--eye-x": `${eyePositions[posIndex].x}px`,
              "--eye-y": `${eyePositions[posIndex].y}px`,
            }}
          >
            <div className={classes.eyeWrapper}>
              <div className={classes.eyeShapeLeft}>
                <div className={classes.wrinkle}></div>
              </div>
              <div className={classes.pupil} />
            </div>
            <div className={classes.eyeWrapper}>
              <div className={classes.eyeShapeRight}>
                <div className={classes.wrinkle}></div>
              </div>
              <div className={classes.pupil} />
            </div>
          </div>
          <Title order={1} c="dimmed" className={classes.label}>
            404
          </Title>
          <Title order={2} ta="center" c="dimmed">
            You have found a secret place...
          </Title>
          <Text c="dimmed" size="lg" ta="center" maw={500}>
            {phrases[textIndex]}
          </Text>
          <Group justify="center">
            <Button
              variant="light"
              size="sm"
              radius="xl"
              color="dark"
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              Take me back to home page
            </Button>
          </Group>
        </Stack>
      </Container>
    </div>
  );
}
