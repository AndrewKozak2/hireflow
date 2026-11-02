import "@mantine/core/styles.css";
import "mantine-react-table/styles.css";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MRT_Table, useMantineReactTable } from "mantine-react-table";
import {
  Center,
  Loader,
  Text,
  Badge,
  Button,
  Group,
  Avatar,
  Select,
} from "@mantine/core";
import clsx from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import styles from "./ApplicationsTable.module.css";
import { ApplicationsService } from "../../../../services/ApplicationsService";
import { JobsService } from "../../../../services/JobsService";
import { useInfiniteScroll } from "../../../../hooks/useInfiniteScroll";

dayjs.extend(relativeTime);

export const ApplicationsTable = ({
  activeTab,
  totalCount = 0,
  globalTotalCount = 0,
  onDataChange,
}) => {
  const [sorting, setSorting] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeJobs, setActiveJobs] = useState([]);
  const [assigningApplicationId, setAssigningApplicationId] = useState(null);

  const isClientSide = globalTotalCount < 100;
  const limit = 25;

  const navigate = useNavigate();
  const [scrollRoot, setScrollRoot] = useState(null);

  const scrollStateRef = useRef({
    page: 1,
    isLoading: false,
    isFetchingNextPage: false,
    hasMore: true,
    sorting: [],
    activeTab: "all",
    isClientSide: false,
  });

  useEffect(() => {
    scrollStateRef.current = {
      page,
      isLoading,
      isFetchingNextPage,
      hasMore,
      sorting,
      activeTab,
      isClientSide,
    };
  }, [
    page,
    isLoading,
    isFetchingNextPage,
    hasMore,
    sorting,
    activeTab,
    isClientSide,
  ]);

  const filteredData = useMemo(() => {
    if (!isClientSide) return data;

    if (activeTab === "all") return data;
    if (activeTab === "new" || activeTab === "unmatched") {
      return data.filter((item) => item.stage === activeTab);
    }
    return data.filter((item) => item.source === activeTab);
  }, [data, activeTab, isClientSide]);

  const loadApplications = useCallback(
    async ({ targetPage, tab, isAppend = false }) => {
      try {
        if (targetPage === 1 && !isAppend) {
          setIsLoading(true);
        } else {
          setIsFetchingNextPage(true);
        }

        const currentLimit = isClientSide ? 100 : limit;
        const queryTab = isClientSide ? "all" : tab;

        const params = {
          page: targetPage,
          limit: currentLimit,
        };

        if (queryTab === "new" || queryTab === "unmatched") {
          params.stage = queryTab;
        } else if (queryTab !== "all") {
          params.source = queryTab;
        }

        const response = await ApplicationsService.getApplications(params);
        const fetchedItems = response?.data?.items || response?.items || [];

        if (isClientSide) {
          setData(fetchedItems);
          setPage(1);
          setHasMore(false);
        } else {
          if (targetPage === 1) {
            setData(fetchedItems);
          } else {
            setData((prev) => [...prev, ...fetchedItems]);
          }
          setPage(targetPage);
          const totalPages = Math.ceil(totalCount / limit);
          setHasMore(fetchedItems.length > 0 && targetPage < totalPages);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    },
    [isClientSide, limit, totalCount],
  );

  const handleMoveToScreening = useCallback(
    async (applicationId) => {
      const previousData = [...data];

      setData((prev) =>
        prev.map((item) =>
          item.id === applicationId ? { ...item, stage: "screening" } : item,
        ),
      );

      try {
        await ApplicationsService.updateApplication(applicationId, {
          stage: "screening",
        });
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error(
          "Failed to update stage on server, rolling back UI:",
          error,
        );
        setData(previousData);
      }
    },
    [data, onDataChange],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadActiveJobs() {
      try {
        const response = await JobsService.getAll({ status: "active" });
        const jobs = response?.data || response || [];
        if (isMounted) setActiveJobs(Array.isArray(jobs) ? jobs : []);
      } catch (error) {
        console.error("Error fetching active jobs:", error);
      }
    }

    loadActiveJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeJobOptions = useMemo(
    () =>
      activeJobs.map((job) => ({
        value: job.id,
        label: job.title,
      })),
    [activeJobs],
  );

  const handleAssignJob = useCallback(
    async (applicationId, jobId) => {
      const previousData = [...data];
      const selectedJob = activeJobs.find((job) => job.id === jobId);

      setAssigningApplicationId(applicationId);
      setData((prev) =>
        prev.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                jobId,
                job: selectedJob ? { ...selectedJob } : item.job,
              }
            : item,
        ),
      );

      try {
        await ApplicationsService.updateApplication(applicationId, { jobId });
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error("Failed to assign job to application:", error);
        setData(previousData);
      } finally {
        setAssigningApplicationId(null);
      }
    },
    [activeJobs, data, onDataChange],
  );

  const handleLoadMore = useCallback(() => {
    const {
      page: currPage,
      isLoading: currLoading,
      isFetchingNextPage: currFetching,
      hasMore: currHasMore,
      activeTab: currTab,
      isClientSide: currClient,
      sorting: currSorting,
    } = scrollStateRef.current;

    if (currLoading || currFetching || !currHasMore || currClient) return;

    scrollStateRef.current.isFetchingNextPage = true;

    loadApplications({
      targetPage: currPage + 1,
      tab: currTab,
      isAppend: true,
      currentSorting: currSorting,
    });
  }, [loadApplications]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    rootMargin: "200px",
    root: scrollRoot,
  });

  const handleSortingChange = useCallback((updater) => {
    setSorting((prevSorting) => {
      return typeof updater === "function" ? updater(prevSorting) : updater;
    });
  }, []);

  useEffect(() => {
    if (isClientSide && data.length > 0) return;

    const timer = setTimeout(() => {
      setSorting([]);
      setPage(1);
      setHasMore(!isClientSide);

      loadApplications({
        targetPage: 1,
        tab: activeTab,
        isAppend: false,
        currentSorting: [],
      });
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isClientSide]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "candidate.firstName",
        id: "candidate",
        header: "Candidate",
        Cell: ({ row }) => {
          const candidate = row.original.candidate;
          if (!candidate)
            return (
              <Text size="sm" color="dimmed">
                —
              </Text>
            );
          const fullName =
            `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim();
          const applicationId = row.original.id;
          return (
            <div
              className={styles.clickableText}
              onClick={() => navigate(`/applications/${applicationId}`)}
            >
              <Avatar name={fullName} color="initials" size="sm" />
              <div>
                <Text size="sm" fw={500}>
                  {fullName}
                </Text>
                <Text size="xs" color="dimmed">
                  {candidate.email}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "job.title",
        id: "job",
        header: "Vacancy",
        Cell: ({ row }) => {
          const jobTitle = row.original.job?.title;
          const applicationId = row.original.id;

          if (!jobTitle) {
            return (
              <Select
                data={activeJobOptions}
                placeholder="Assign job"
                searchable
                clearable={false}
                size="xs"
                radius="xs"
                disabled={activeJobOptions.length === 0}
                value={null}
                onChange={(jobId) => {
                  if (jobId) handleAssignJob(applicationId, jobId);
                }}
                comboboxProps={{ withinPortal: true }}
                nothingFoundMessage="No active jobs"
                rightSection={
                  assigningApplicationId === applicationId ? (
                    <Loader size="xs" />
                  ) : undefined
                }
              />
            );
          }

          return <Text size="sm">{jobTitle}</Text>;
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        Cell: ({ cell }) => {
          const source = (cell.getValue() || "").toLowerCase();
          const sourceColors = {
            djinni: "green",
            dou: "blue",
            linkedin: "indigo",
            manual: "gray",
            referral: "orange",
            talent_pool: "#7048e8",
          };
          return (
            <Badge
              color={sourceColors[source] || "gray"}
              variant="light"
              size="sm"
              radius="xs"
            >
              {source}
            </Badge>
          );
        },
        maxSize: 130,
      },
      {
        accessorKey: "aiScore",
        header: "AI Score",
        Cell: ({ cell }) => {
          const score = cell.getValue();
          if (score === undefined || score === null)
            return (
              <Badge
                size="xl"
                color="gray"
                variant="light"
                circle
                styles={{ label: { fontSize: "8px" } }}
              >
                No CV
              </Badge>
            );
          const getScoreColor = (val) =>
            val >= 70 ? "green" : val < 70 ? "yellow" : "red";
          return (
            <Badge
              color={getScoreColor(score)}
              variant="light"
              size="xl"
              circle
              styles={{ label: { fontSize: "10px" } }}
            >
              {score}%
            </Badge>
          );
        },
        maxSize: 100,
      },
      {
        accessorKey: "stage",
        header: "Stage",
        Cell: ({ cell }) => {
          const stage = (cell.getValue() || "").toLowerCase();
          const stageColors = {
            screening: "#f08c00",
            pre_interview: "#1971c2",
            technical_interview: "#7048e8",
            new: "#4263eb",
            offer: "#f76707",
            rejected: "#fa5252",
            hired: "#2f9e44",
          };
          return (
            <Badge
              color={stageColors[stage] || "gray"}
              variant="light"
              size="sm"
            >
              {stage}
            </Badge>
          );
        },
        maxSize: 120,
      },
      {
        accessorKey: "createdAt",
        header: "Received",
        Cell: ({ cell }) => {
          const date = cell.getValue();
          return (
            <Text size="sm" title={dayjs(date).format("DD.MM.YYYY HH:mm")}>
              {dayjs(date).fromNow()}
            </Text>
          );
        },
        maxSize: 140,
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => {
          const applicationId = row.original.id;
          const currentStage = (row.original.stage || "").toLowerCase();
          const canMoveToScreening = currentStage === "new";
          return (
            <Group gap="xs" wrap="nowrap" justify="flex-end">
              {canMoveToScreening && (
                <Button
                  variant="filled"
                  size="compact-xs"
                  onClick={() => handleMoveToScreening(applicationId)}
                >
                  Move to Screening
                </Button>
              )}
              <Button
                variant="default"
                size="compact-xs"
                onClick={() => navigate(`/applications/${applicationId}`)}
              >
                View
              </Button>
            </Group>
          );
        },
        maxSize: 180,
        enableSorting: false,
      },
    ],
    [
      activeJobOptions,
      assigningApplicationId,
      handleAssignJob,
      handleMoveToScreening,
      navigate,
    ],
  );

  const table = useMantineReactTable({
    columns,
    data: filteredData,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableSorting: true,
    enableSortingIndicators: false,
    enableMultiSort: false,
    enableColumnResizing: false,
    onSortingChange: handleSortingChange,
    manualSorting: false,
    state: { sorting, isLoading },
    mantineTableHeadCellProps: {
      style: {
        textTransform: "uppercase",
        color: "#868e96",
        fontSize: "12px",
        padding: "12px 16px",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor: "#f8f9fa",
      },
    },
    mantineTableBodyCellProps: { style: { padding: "14px 16px" } },
    mantineTableProps: {
      className: clsx(styles.table),
      highlightOnHover: true,
      withColumnBorders: false,
      withRowBorders: true,
      withTableBorder: true,
    },
  });

  if (isLoading && page === 1) {
    return (
      <Center py="xl">
        <Loader color="indigo" size="md" />
      </Center>
    );
  }

  return (
    <>
      <div ref={setScrollRoot} className={styles.scrollContainer}>
        <MRT_Table table={table} />

        {hasMore && !isClientSide && (
          <div
            ref={sentinelRef}
            style={{ height: "10px", width: "100%", background: "transparent" }}
          />
        )}
      </div>

      {isFetchingNextPage && (
        <Center py="sm">
          <Loader color="indigo" size="xs" />
        </Center>
      )}

      {(!hasMore || isClientSide) && filteredData.length > 0 && (
        <Text size="xs" color="dimmed" ta="center" pt="xs">
          All applications loaded
        </Text>
      )}
    </>
  );
};

export default ApplicationsTable;
