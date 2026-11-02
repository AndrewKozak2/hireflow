import { useState, useEffect } from "react";
import { Card, Center, Text, Title, useMantineTheme } from "@mantine/core";

import { SourceDonutChart } from "./SourceDonutChart";
import { SourceBreakdownTable } from "./SourceBreakdownTable";
import styles from "./SourceBreakdown.module.css";
import { AnalyticsService } from "../../../../services/AnalyticsService";

export const SourceBreakdown = ({ from, to }) => {
  const theme = useMantineTheme();
  const [activeSource, setActiveSource] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = (source) => {
    setActiveSource((prev) => (prev === source ? null : source));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchSources = async () => {
      try {
        setLoading(true);

        const res = await AnalyticsService.getSources({ from, to });

        if (!isMounted) return;

        const normalized = Array.isArray(res) ? res : [];

        console.log("API:", res);

        setData(normalized);
      } catch (e) {
        console.error(e);
        if (isMounted) setData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (from && to) fetchSources();

    return () => {
      isMounted = false;
    };
  }, [from, to]);

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg">
        <Title order={3} fz={15} mb={15} c={theme.colors.gray[9]}>
          Source breakdown
        </Title>
        <div className={styles.skeleton}>Loading...</div>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card
        withBorder
        radius="md"
        p="lg"
        h="100%"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Title order={3} fz={15} mb={15} c={theme.colors.gray[9]}>
          Source breakdown
        </Title>
        <Center py="xl" style={{ flex: 1 }}>
          <Text c={theme.colors.gray[6]}>
            No application data for this period
          </Text>
        </Center>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" p="lg">
      <Title order={3} fz={15} mb={15} c={theme.colors.gray[9]}>
        Source breakdown
      </Title>

      <div className={styles.wrapper}>
        <SourceDonutChart
          data={data}
          activeSource={activeSource}
          onSelect={handleSelect}
        />

        <SourceBreakdownTable
          data={data}
          activeSource={activeSource}
          onRowSelect={handleSelect}
        />
      </div>
    </Card>
  );
};
