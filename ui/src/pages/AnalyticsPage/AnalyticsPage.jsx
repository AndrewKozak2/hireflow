import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Container,
  Title,
  Group,
  Button,
  Select,
  Box,
  Flex,
  SimpleGrid,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useAuth } from "../../hooks/useAuth";
import { IconCalendar, IconDownload } from "@tabler/icons-react";
import { AnalyticsService } from "../../services/AnalyticsService";
import {
  getDatesForPreset,
  isValidDateRange,
} from "../../shared/components/date-helpers";
import { SourceBreakdown } from "../AnalyticsPage/components/SourceBreakdown/SourceBreakdown";
import { Metrics } from "./components/Metrics/Metrics";
import { RecruitmentFunnel } from "./components/RecruitmentFunnel/RecruitmentFunnel";
import { RecruitmentCosts } from "./components/RecruitmentCosts/RecruitmentCosts";
import { theme } from "../../theming/theme";

dayjs.extend(isSameOrBefore);

const DATE_PRESETS = ["7d", "30d", "3months", "6months"];

const getExportFilename = (contentDisposition, fallbackFilename) => {
  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);

  return filenameMatch?.[1] ?? fallbackFilename;
};

const getPresetForDateRange = (from, to) => {
  if (!from || !to) {
    return "30d";
  }

  return (
    DATE_PRESETS.find((preset) => {
      const presetRange = getDatesForPreset(preset);

      return (
        dayjs(from).isSame(presetRange.from, "day") &&
        dayjs(to).isSame(presetRange.to, "day")
      );
    }) ?? "custom"
  );
};

const AnalyticsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const initialFrom = searchParams.get("from");
  const initialTo = searchParams.get("to");

  const defaultFrom = dayjs().subtract(30, "days").toDate();
  const defaultTo = dayjs().toDate();

  const [selectedFrom, setSelectedFrom] = useState(
    initialFrom ? dayjs(initialFrom).toDate() : defaultFrom,
  );
  const [selectedTo, setSelectedTo] = useState(
    initialTo ? dayjs(initialTo).toDate() : defaultTo,
  );
  const [activePreset, setActivePreset] = useState(() =>
    getPresetForDateRange(initialFrom, initialTo),
  );
  const [dateRangeError, setDateRangeError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState([
    initialFrom ? dayjs(initialFrom).toDate() : defaultFrom,
    initialTo ? dayjs(initialTo).toDate() : defaultTo,
  ]);

  useEffect(() => {
    const fromStr = dayjs(selectedFrom).format("YYYY-MM-DD");
    const toStr = dayjs(selectedTo).format("YYYY-MM-DD");

    if (
      searchParams.get("from") !== fromStr ||
      searchParams.get("to") !== toStr
    ) {
      setSearchParams({ from: fromStr, to: toStr });
    }
  }, [selectedFrom, selectedTo, searchParams, setSearchParams]);

  const handlePresetChange = (value) => {
    setActivePreset(value);

    if (value === "custom") {
      setDateRange([selectedFrom, selectedTo]);
      setDateRangeError("");
      return;
    }

    const { from, to } = getDatesForPreset(value);
    setSelectedFrom(dayjs(from).toDate());
    setSelectedTo(dayjs(to).toDate());
    setDateRangeError("");
  };

  const handleApplyCustomRange = () => {
    const [start, end] = dateRange;
    if (!start || !end) return;

    const fromStr = dayjs(start).format("YYYY-MM-DD");
    const toStr = dayjs(end).format("YYYY-MM-DD");

    if (!isValidDateRange(fromStr, toStr)) {
      setDateRangeError(
        "Invalid date range: Start date must be before or equal to end date, and no future dates are allowed.",
      );
      return;
    }

    setDateRangeError("");
    setSelectedFrom(start);
    setSelectedTo(end);
  };

  const isHiringManager = user?.role === "hiring_manager";
  const isAdminOrRecruiter =
    user?.role === "admin" || user?.role === "recruiter";

  const currentFrom = dayjs(selectedFrom).format("YYYY-MM-DD");
  const currentTo = dayjs(selectedTo)
    .endOf("day")
    .format("YYYY-MM-DDTHH:mm:ss");

  const handleExportCsv = async () => {
    setIsExporting(true);

    try {
      const response = await AnalyticsService.exportCsv({
        from: currentFrom,
        to: currentTo,
      });
      const filename = getExportFilename(
        response.headers["content-disposition"],
        `hireflow-analytics-${currentFrom}.csv`,
      );
      const downloadUrl = URL.createObjectURL(response.data);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      notifications.show({
        title: "Export failed",
        message: "Could not export analytics data. Please try again.",
        color: "red",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Container fluid style={{ paddingInline: 0 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        mb="xl"
        direction={{ base: "column", sm: "row" }}
        gap="md"
      >
        <Box>
          <Title order={2} fz={24} fw={700} lts="-0.5px">
            Analytics
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            Recruitment performance overview
          </Text>
        </Box>
        <Group
          gap="sm"
          align="center"
          style={{ width: { base: "100%", sm: "auto" } }}
        >
          <Select
            value={activePreset}
            onChange={handlePresetChange}
            style={{ width: 160 }}
            allowDeselect={false}
            data={[
              { label: "Last 7 Days", value: "7d" },
              { label: "Last 30 Days", value: "30d" },
              { label: "Last 3 Months", value: "3months" },
              { label: "Last 6 Months", value: "6months" },
              { label: "Custom range...", value: "custom" },
            ]}
          />

          {activePreset === "custom" && (
            <Group gap="xs">
              <DatePickerInput
                type="range"
                placeholder="Pick date range"
                leftSection={<IconCalendar size={16} stroke={1.5} />}
                value={dateRange}
                valueFormat="DD.MM.YYYY"
                onChange={setDateRange}
                maxDate={dayjs().toDate()}
                clearable
                style={{ width: 250 }}
              />
              <Button
                onClick={handleApplyCustomRange}
                disabled={!dateRange[0] || !dateRange[1]}
              >
                Apply
              </Button>
            </Group>
          )}

          {!isHiringManager && isAdminOrRecruiter && (
            <Button
              variant="outline"
              leftSection={<IconDownload size={16} />}
              loading={isExporting}
              onClick={handleExportCsv}
              style={{
                color: theme.colors.gray[8],
                borderColor: theme.colors.gray[3],
              }}
            >
              Export CSV
            </Button>
          )}
        </Group>

        {dateRangeError && (
          <Text c="red" size="sm" mt="sm">
            {dateRangeError}
          </Text>
        )}
      </Flex>
      <Box>
        <Metrics from={currentFrom} to={currentTo} />
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="xl">
          <RecruitmentFunnel from={currentFrom} to={currentTo} />
          <SourceBreakdown from={currentFrom} to={currentTo} />
        </SimpleGrid>
        <RecruitmentCosts from={currentFrom} to={currentTo} />
      </Box>
    </Container>
  );
};

export default AnalyticsPage;
