import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Group,
  Title,
  Badge,
  Tabs,
  Stack,
  Loader,
  Center,
} from "@mantine/core";
import ApplicationsTable from "./components/ApplicationsTable/ApplicationsTable.jsx";
import { ApplicationsService } from "../../services/ApplicationsService.js";

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [isCountsLoading, setIsCountsLoading] = useState(true);

  const [counts, setCounts] = useState({
    all: 0,
    new: 0,
    unmatched: 0,
    djinni: 0,
    dou: 0,
    linkedin: 0,
    manual: 0,
    referral: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const response = await ApplicationsService.getCounts();

      const data = response;

      if (data) {
        setCounts({
          all: data.all ?? 0,
          new: data.new ?? 0,
          unmatched: data.unmatched ?? 0,
          djinni: data.djinni ?? 0,
          dou: data.dou ?? 0,
          linkedin: data.linkedin ?? 0,
          manual: data.manual ?? 0,
          referral: data.referral ?? 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch real application counts:", error);
    } finally {
      setIsCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchCounts();
    })();
  }, [fetchCounts]);

  if (isCountsLoading) {
    return (
      <Center style={{ height: "80vh" }}>
        <Loader color="indigo" size="xl" type="dots" />
      </Center>
    );
  }

  const currentTabCount = counts[activeTab] || 0;

  return (
    <Container fluid py="xs" style={{ paddingInline: 0 }}>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Title order={2}>Applications</Title>
            <Badge color="green" variant="light" size="md">
              New: {counts.new}
            </Badge>
            {counts.unmatched > 0 && (
              <Badge color="red" variant="light" size="md">
                Unmatched: {counts.unmatched}
              </Badge>
            )}
          </Group>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} variant="default">
          <Tabs.List>
            <Tabs.Tab
              value="all"
              rightSection={
                <Badge size="xs" variant="light">
                  {counts.all}
                </Badge>
              }
            >
              All
            </Tabs.Tab>
            <Tabs.Tab
              value="new"
              rightSection={
                <Badge size="xs" color="green" variant="light">
                  {counts.new}
                </Badge>
              }
            >
              New
            </Tabs.Tab>
            <Tabs.Tab
              value="djinni"
              rightSection={
                <Badge size="xs" color="teal" variant="light">
                  {counts.djinni}
                </Badge>
              }
            >
              Djinni
            </Tabs.Tab>
            <Tabs.Tab
              value="dou"
              rightSection={
                <Badge size="xs" color="blue" variant="light">
                  {counts.dou}
                </Badge>
              }
            >
              DOU
            </Tabs.Tab>
            <Tabs.Tab
              value="linkedin"
              rightSection={
                <Badge size="xs" color="indigo" variant="light">
                  {counts.linkedin}
                </Badge>
              }
            >
              LinkedIn
            </Tabs.Tab>
            <Tabs.Tab
              value="manual"
              rightSection={
                <Badge size="xs" color="gray" variant="light">
                  {counts.manual}
                </Badge>
              }
            >
              Manual
            </Tabs.Tab>
            <Tabs.Tab
              value="referral"
              rightSection={
                <Badge size="xs" color="orange" variant="light">
                  {counts.referral}
                </Badge>
              }
            >
              Referral
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} mt={24}>
            <ApplicationsTable
              activeTab={activeTab}
              onDataChange={fetchCounts}
              totalCount={currentTabCount}
              globalTotalCount={counts.all}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
