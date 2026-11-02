import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Flex,
  Group,
  Stack,
  Tabs,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "../../routes/routes";
import { HiringRequestsService } from "../../services/HiringRequestsService";
import { HiringRequestStatus } from "../../constants/hiringRequestConstants";
import { useAuthStore } from "../../stores/useAuthStore";
import { ROLES } from "../../constants/roles";
import { useNotifications } from "../../hooks/useNotifications";
import { HiringRequestsTable } from "./components/HiringRequestsTable";
import { RejectHiringRequestModal } from "./components/RejectHiringRequestModal";
import { useRejectHiringRequest } from "./hooks/useRejectHiringRequest";

export default function HiringRequestsPage() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { onError } = useNotifications();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === ROLES.ADMIN;
  const isRecruiter = user?.role === ROLES.RECRUITER;
  const isHiringManager = user?.role === ROLES.MANAGER;
  const canPerformActions = isAdmin || isRecruiter;

  const tabs = [
    { value: HiringRequestStatus.ALL, label: "All" },
    ...(isHiringManager || isAdmin
      ? [{ value: HiringRequestStatus.DRAFT, label: "Drafts" }]
      : []),
    { value: HiringRequestStatus.PENDING, label: "Pending" },
    { value: HiringRequestStatus.IN_REVIEW, label: "In Review" },
    { value: HiringRequestStatus.APPROVED, label: "Approved" },
    { value: HiringRequestStatus.REJECTED, label: "Rejected" },
    { value: HiringRequestStatus.CANCELLED, label: "Cancelled" },
  ];

  const {
    rejectTarget,
    rejecting,
    openRejectModal,
    closeRejectModal,
    confirmReject,
  } = useRejectHiringRequest({
    onRejected: (updatedRequest) => {
      setAllRequests((currentRequests) =>
        currentRequests.map((item) =>
          item.id === updatedRequest.id ? updatedRequest : item,
        ),
      );
    },
  });

  const isKnownStatus = tabs.some((tab) => tab.value === statusFromUrl);
  const [activeTab, setActiveTab] = useState(
    isKnownStatus && statusFromUrl ? statusFromUrl : HiringRequestStatus.ALL,
  );

  useEffect(() => {
    const fetchFn = canPerformActions
      ? HiringRequestsService.getHiringRequests
      : HiringRequestsService.getMyHiringRequests;
    fetchFn()
      .then((data) => {
        setAllRequests(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("HiringRequestsPage - API error:", err);
        onError({ message: "Failed to load hiring requests" });
      })
      .finally(() => setLoading(false));
  }, [canPerformActions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === HiringRequestStatus.ALL) {
      if (statusFromUrl) {
        setSearchParams({}, { replace: true });
      }
      return;
    }

    if (statusFromUrl !== activeTab) {
      setSearchParams({ status: activeTab }, { replace: true });
    }
  }, [activeTab, setSearchParams, statusFromUrl]);

  const requests = useMemo(() => {
    if (activeTab === HiringRequestStatus.ALL) {
      return allRequests;
    }

    return allRequests.filter((request) => request.status === activeTab);
  }, [activeTab, allRequests]);

  const countsByTab = useMemo(() => {
    const counts = {
      [HiringRequestStatus.ALL]: allRequests.length,
      [HiringRequestStatus.DRAFT]: 0,
      [HiringRequestStatus.PENDING]: 0,
      [HiringRequestStatus.IN_REVIEW]: 0,
      [HiringRequestStatus.APPROVED]: 0,
      [HiringRequestStatus.REJECTED]: 0,
      [HiringRequestStatus.CANCELLED]: 0,
    };

    allRequests.forEach((request) => {
      if (counts[request.status] !== undefined) {
        counts[request.status] += 1;
      }
    });

    return counts;
  }, [allRequests]);

  const pendingCount = allRequests.filter(
    (r) => r.status === HiringRequestStatus.PENDING,
  ).length;

  const handleViewRequest = (request) => {
    navigate(ROUTES.HIRING_REQUESTS + `/${request.id}`);
  };
  const handleViewJob = (request) => {
    navigate(ROUTES.JOB_DETAIL.replace(":id", request.job_id));
  };

  const handleTabChange = (value) => {
    setActiveTab(value || HiringRequestStatus.ALL);
  };

  const handleDeleteDraft = async (request) => {
    try {
      await HiringRequestsService.deleteDraft(request.id);
      setAllRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch {
      onError({ message: "Failed to delete draft" });
    }
  };

  const handleTakeInReview = async (request) => {
    try {
      const updatedRequest =
        await HiringRequestsService.takeHiringRequestInReview(request.id);
      if (updatedRequest) {
        setAllRequests((currentRequests) =>
          currentRequests.map((item) =>
            item.id === updatedRequest.id ? updatedRequest : item,
          ),
        );
      }
    } catch {
      onError({ message: "Failed to take hiring request in review" });
    }
  };

  const getTabBadgeStyles = (tabValue, isActive) => {
    if (tabValue === HiringRequestStatus.PENDING) {
      return {
        root: {
          backgroundColor: isActive
            ? theme.colors.warning[1]
            : theme.colors.warning[0],
          color: theme.other.appColors.warning,
          border: "none",
        },
      };
    }

    return {
      root: {
        backgroundColor: isActive
          ? theme.colors.indigo[0]
          : theme.colors.gray[1],
        color: isActive ? theme.colors.indigo[7] : theme.colors.gray[6],
        border: "none",
      },
    };
  };

  return (
    <>
      <Flex justify="space-between" align="flex-start" mb="xl">
        <div>
          {!loading && (
            <Text size="sm" c="dimmed" mt={4}>
              {requests.length} requests total
              {pendingCount > 0 ? ` · ${pendingCount} need your review` : ""}
            </Text>
          )}
        </div>
        {(isAdmin || isHiringManager) && (
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={() => navigate(ROUTES.HIRING_REQUESTS_NEW)}
          >
            New Hiring Request
          </Button>
        )}
      </Flex>
      <Stack gap="lg">
        <Card p={0} bg="transparent" shadow="none">
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tabs.List
              grow={false}
              justify="flex-start"
              style={{
                gap: theme.spacing.lg,
              }}
            >
              {tabs.map((tab) => (
                <Tabs.Tab
                  key={tab.value}
                  value={tab.value}
                  px={0}
                  style={{
                    padding: 0,
                    color:
                      activeTab === tab.value
                        ? theme.colors.indigo[7]
                        : theme.colors.gray[6],
                    fontSize: theme.fontSizes.sm,
                    fontWeight: 500,
                    borderBottomColor:
                      activeTab === tab.value
                        ? theme.colors.indigo[7]
                        : "transparent",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = "transparent";
                    if (activeTab !== tab.value) {
                      event.currentTarget.style.color = theme.colors.gray[9];
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (activeTab !== tab.value) {
                      event.currentTarget.style.color = theme.colors.gray[6];
                    }
                  }}
                >
                  <Group
                    gap="xs"
                    wrap="nowrap"
                    style={{ padding: "10px 14px" }}
                  >
                    <Text
                      span
                      inherit
                      c="inherit"
                      fw={activeTab === tab.value ? 500 : 400}
                    >
                      {tab.label}
                    </Text>
                    {tab.value !== HiringRequestStatus.ALL ? (
                      <Badge
                        radius="xl"
                        size="md"
                        styles={getTabBadgeStyles(
                          tab.value,
                          activeTab === tab.value,
                        )}
                        style={{
                          padding: "1px 6px",
                        }}
                      >
                        {countsByTab[tab.value] ?? 0}
                      </Badge>
                    ) : null}
                  </Group>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </Card>

        <Card p={0}>
          <Stack gap="md">
            <HiringRequestsTable
              requests={requests}
              onViewRequest={handleViewRequest}
              onViewJob={handleViewJob}
              onTakeInReview={handleTakeInReview}
              onReject={openRejectModal}
              onDeleteDraft={handleDeleteDraft}
              canPerformActions={canPerformActions}
              currentUserId={user?.id}
            />
          </Stack>
        </Card>
      </Stack>

      <RejectHiringRequestModal
        opened={Boolean(rejectTarget)}
        requestTitle={rejectTarget?.job_title}
        loading={rejecting}
        onClose={closeRejectModal}
        onConfirm={confirmReject}
      />
    </>
  );
}
