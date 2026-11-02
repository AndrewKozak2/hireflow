import { Container, Loader, Stack, Text } from "@mantine/core";
import { useParams } from "react-router-dom";
import { useApplicationDetail } from "../../hooks/useApplicationDetail";
import { ApplicationHeader } from "./components/ApplicationHeader/ApplicationHeader";
import { ApplicationPipeline } from "./components/ApplicationPipeline/ApplicationPipeline";
import { ApplicationTabs } from "./components/ApplicationTabs/ApplicationTabs";
import { useEffect } from "react";

export default function ApplicationDetail() {
  const { id } = useParams();
  const { application, isLoading, error, refresh } = useApplicationDetail(id);

  useEffect(() => {
    if (application && application.aiScore === null) {
      const timer = setTimeout(() => {
        refresh();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [application, refresh]);

  if (isLoading && !application) {
    return (
      <Container
        size="xl"
        py="xl"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <Loader />
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Text c="red">{String(error)}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <ApplicationHeader application={application} />
        <ApplicationPipeline application={application} />
        <ApplicationTabs application={application} onRefresh={refresh} />
      </Stack>
    </Container>
  );
}
