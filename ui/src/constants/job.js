export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Internship" },
];

export const JOB_STATUSES = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
  REJECTED: "rejected",
};

export const JOB_STATUS_CONFIG = {
  [JOB_STATUSES.DRAFT]: { color: "gray", label: "Draft" },
  [JOB_STATUSES.PENDING_APPROVAL]: {
    color: "orange",
    label: "Pending Approval",
  },
  [JOB_STATUSES.ACTIVE]: { color: "green", label: "Active" },
  [JOB_STATUSES.PAUSED]: { color: "blue", label: "Paused" },
  [JOB_STATUSES.CLOSED]: { color: "dark", label: "Closed" },
  [JOB_STATUSES.REJECTED]: { color: "red", label: "Rejected" },
};
