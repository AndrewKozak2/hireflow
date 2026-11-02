import React from "react";
import { HiringRequestStatus } from "../../../constants/hiringRequestConstants";
import { StatusTimeline } from "../../../components/StatusTimeline/StatusTimeline";

export function HiringRequestStatusTimeline({ status }) {
  const isInReview = status === HiringRequestStatus.IN_REVIEW;
  const isApproved = status === HiringRequestStatus.APPROVED;
  const isRejected = status === HiringRequestStatus.REJECTED;

  const stages = [
    {
      label: "Submitted",
      state: "done",
    },
    {
      label: "In Review",
      state:
        isApproved || isRejected ? "done" : isInReview ? "current" : "default",
    },
    {
      label: isRejected ? "Rejected" : "Approved",
      state: isRejected ? "rejected" : isApproved ? "current" : "default",
    },
  ];

  return <StatusTimeline stages={stages} />;
}
