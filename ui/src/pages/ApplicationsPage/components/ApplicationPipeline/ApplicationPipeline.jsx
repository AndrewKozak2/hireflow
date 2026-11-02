import React from "react";
import { StatusTimeline } from "../../../../components/StatusTimeline/StatusTimeline";

const PIPELINE_STAGES = [
  "Screening",
  "Pre-interview",
  "Technical",
  "Offer",
  "Hired",
];

const STAGE_TO_STEP = {
  new: 0,
  screening: 0,
  pre_interview: 1,
  technical_interview: 2,
  offer: 3,
  hired: 4,
};

export function ApplicationPipeline({ application }) {
  const stageId = application?.stage;
  const isRejected = stageId === "rejected";

  const activeStep = STAGE_TO_STEP[stageId];

  const timelineStages = PIPELINE_STAGES.map((label, index) => {
    let state;
    if (stageId === "new") {
      state = "default";
    } else if (isRejected) {
      state = "done";
    } else {
      if (index < activeStep) {
        state = "done";
      } else if (index === activeStep) {
        state = "current";
      } else {
        state = "default";
      }
    }
    return { label, state };
  });

  if (isRejected) {
    timelineStages.push({ label: "Rejected", state: "rejected" });
  }

  return <StatusTimeline stages={timelineStages} />;
}
