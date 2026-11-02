import { useEffect, useMemo, useState } from "react";
import { SimpleGrid } from "@mantine/core";
import { AnalyticsService } from "../../../../services/AnalyticsService";
import { KeyMetricCard } from "./KeyMetricCard";
import { KeyMetricSkeleton } from "./KeyMetricSkeleton";

function getTrend(current, previous) {
  if (current == null && previous == null) {
    return null;
  }

  if (previous === 0) {
    return "New";
  }

  if (current == null || previous == null) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function formatTrend(trend) {
  if (trend == null) {
    return null;
  }

  if (trend === "New") {
    return "New";
  }

  return `${Math.abs(trend).toFixed(0)}% vs prev`;
}

function getTimeToHireTrendLabel(current, previous) {
  if (current == null && previous == null) {
    return null;
  }

  if (previous === 0) {
    return "New";
  }

  if (current == null || previous == null) {
    return null;
  }

  const daysDifference = Math.round(Math.abs(current - previous));
  return `${daysDifference}d ${current <= previous ? "faster" : "slower"}`;
}

function buildMetricCards(data) {
  const timeToHireTrend = getTrend(
    data.current.avgTimeToHire,
    data.previous.avgTimeToHire,
  );
  const acceptanceTrend = getTrend(
    data.current.offerAcceptanceRate,
    data.previous.offerAcceptanceRate,
  );
  const totalApplicationsTrend = getTrend(
    data.current.totalApplications,
    data.previous.totalApplications,
  );
  const aiCoverageTrend = getTrend(
    data.current.aiCoverage,
    data.previous.aiCoverage,
  );

  return [
    {
      key: "averageTimeToHire",
      label: "Avg. time to hire",
      value:
        data.current.avgTimeToHire == null
          ? "—"
          : `${Math.round(data.current.avgTimeToHire)}d`,
      trend: timeToHireTrend,
      trendLabel: getTimeToHireTrendLabel(
        data.current.avgTimeToHire,
        data.previous.avgTimeToHire,
      ),
      positiveDirection: "down",
    },
    {
      key: "offerAcceptanceRate",
      label: "Offer acceptance",
      value:
        data.current.offerAcceptanceRate == null
          ? "—"
          : `${data.current.offerAcceptanceRate}%`,
      trend: acceptanceTrend,
      trendLabel: formatTrend(acceptanceTrend),
      positiveDirection: "up",
    },
    {
      key: "totalApplications",
      label: "Total applications",
      value:
        data.current.totalApplications == null
          ? "—"
          : data.current.totalApplications,
      trend: totalApplicationsTrend,
      trendLabel: formatTrend(totalApplicationsTrend),
      positiveDirection: "up",
    },
    {
      key: "aiCoverage",
      label: "AI coverage",
      value:
        data.current.aiCoverage == null ? "—" : `${data.current.aiCoverage}%`,
      trend: aiCoverageTrend,
      trendLabel: formatTrend(aiCoverageTrend),
      positiveDirection: "up",
    },
  ];
}

export function Metrics({ from, to }) {
  const [metricsData, setMetricsData] = useState(null);

  useEffect(() => {
    let ignore = false;

    AnalyticsService.getMetrics({ from, to })
      .then((data) => {
        if (ignore) {
          return;
        }

        setMetricsData(data);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setMetricsData(null);
      });

    return () => {
      ignore = true;
    };
  }, [from, to]);

  const metrics = useMemo(
    () => (metricsData ? buildMetricCards(metricsData) : []),
    [metricsData],
  );

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
      {metricsData
        ? metrics.map((metric) => (
            <KeyMetricCard key={metric.key} metric={metric} />
          ))
        : Array.from({ length: 4 }, (_, index) => (
            <KeyMetricSkeleton key={index} />
          ))}
    </SimpleGrid>
  );
}
