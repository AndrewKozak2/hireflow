import { useState, useEffect, useCallback, useMemo } from "react";
import { ApplicationsService } from "../services/ApplicationsService";
import { notifications } from "@mantine/notifications";
import { STAGES } from "../constants/application.js";

export function usePipeline(jobId) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await ApplicationsService.getApplications({
        jobId,
        limit: 1000,
      });
      const items = response.items || response.data || [];

      setApplications(items);
      setError(null);
    } catch {
      setError("Failed to load applications");
      notifications.show({
        title: "Error",
        message: "Could not fetch applications for this job",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    // Only call if we have a jobId
    if (jobId) {
      setTimeout(() => fetchApplications(), 0);
    } else {
      setTimeout(() => setIsLoading(false), 0);
    }
  }, [jobId, fetchApplications]);

  const groupedApplications = useMemo(() => {
    const groups = STAGES.reduce((acc, stage) => {
      acc[stage.id] = [];
      return acc;
    }, {});

    applications.forEach((app) => {
      if (groups[app.stage]) {
        groups[app.stage].push(app);
      }
    });

    return groups;
  }, [applications]);

  const totalApplicationsCount = applications.length;

  const moveApplication = async (
    applicationId,
    newStage,
    rejectionReason = null,
    rejectionComment = null,
    emailMessage = null,
    sendEmail = false,
    emailSubject = null,
  ) => {
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return;

    const oldStage = application.stage;
    if (oldStage === newStage) return;

    // Transition rules
    if (newStage === "hired" && oldStage !== "offer") {
      notifications.show({
        title: "Move Blocked",
        message: "Candidates can only be moved to Hired from the Offer stage.",
        color: "orange",
      });
      return;
    }

    // if (newStage === "offer") {
    //   const hasProceed =
    //     application.score_card?.recommendation === "proceed" ||
    //     application.scoreCard?.recommendation === "proceed" ||
    //     application.recommendation === "proceed";
    //   if (!hasProceed) {
    //     notifications.show({
    //       title: "Move Blocked",
    //       message:
    //         "A Score Card with 'Proceed' recommendation is required before moving to Offer.",
    //       color: "orange",
    //     });
    //     return;
    //   }
    // }

    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, stage: newStage } : app,
      ),
    );

    try {
      // Skip API call for mock items
      if (!applicationId.startsWith("m")) {
        await ApplicationsService.changeStage(
          applicationId,
          newStage,
          rejectionReason,
          rejectionComment,
          emailMessage,
          sendEmail,
          emailSubject,
        );
      }
      notifications.show({
        title: "Success",
        message: `Candidate moved to ${newStage.replace("_", " ")}`,
        color: "green",
      });
    } catch (err) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, stage: oldStage } : app,
        ),
      );
      notifications.show({
        title: "Error",
        message: err.response?.data?.message || "Failed to move candidate",
        color: "red",
      });
    }
  };

  return {
    groupedApplications: groupedApplications,
    rawApplications: applications,
    totalApplicationsCount,
    isLoadingApplications: isLoading,
    errorApplications: error,
    moveApplication,
    refreshApplications: fetchApplications,
  };
}
