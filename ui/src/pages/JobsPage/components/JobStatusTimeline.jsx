import React from "react";
import { JOB_STATUSES } from "../../../constants/job";
import { StatusTimeline } from "../../../components/StatusTimeline/StatusTimeline";

export function JobStatusTimeline({ status }) {
  const isPending = status === JOB_STATUSES.PENDING_APPROVAL;
  const isActiveStatus = status === JOB_STATUSES.ACTIVE;
  const isPaused = status === JOB_STATUSES.PAUSED;
  const isRejected = status === JOB_STATUSES.REJECTED;
  const isClosed = status === JOB_STATUSES.CLOSED;

  const getDraftState = () =>
    isPending || isActiveStatus || isPaused || isClosed
      ? "done"
      : isRejected
        ? "rejected"
        : "current";

  const getPendingState = () => {
    if (isActiveStatus || isPaused || isClosed) return "done";
    if (isRejected) return "rejected";
    if (isPending) return "current";
    return "default";
  };

  const getActiveState = () => {
    if (isClosed) return "done";
    if (isPaused) return "paused";
    if (isActiveStatus) return "current";
    return "default";
  };

  const getFinalLabel = () => {
    if (isClosed) return "Closed";
    if (isPaused) return "Active (Paused)";
    return "Active";
  };

  const stages = [
    {
      label: isRejected ? "Draft (Rejected)" : "Draft",
      state: getDraftState(),
    },
    { label: "Pending Approval", state: getPendingState() },
    { label: getFinalLabel(), state: getActiveState() },
  ];

  return <StatusTimeline stages={stages} />;
}
