// ── Select/Radio option lists (values match backend enums) ────────────────────

export const DEPARTMENTS = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
];

export const EXPERTISE_LEVELS = [
  {
    value: "L1",
    label: "L1",
    description: "Entry - needs guidance on most tasks",
  },
  {
    value: "L2",
    label: "L2",
    description: "Junior - handles routine tasks independently",
  },
  { value: "L3", label: "L3", description: "Mid - owns features end-to-end" },
  {
    value: "L4",
    label: "L4",
    description: "Senior - sets technical direction for a team",
  },
  {
    value: "L5",
    label: "L5",
    description: "Lead / Staff - drives outcomes across teams",
  },
  {
    value: "L6",
    label: "L6",
    description: "Principal - shapes strategy across the org",
  },
];

export const ENGLISH_LEVELS = [
  {
    value: "A2",
    label: "A2",
    description: "Elementary - basic everyday phrases",
  },
  {
    value: "B1",
    label: "B1",
    description: "Intermediate - can handle most work conversations",
  },
  {
    value: "B2",
    label: "B2",
    description: "Upper-intermediate - fluent in professional contexts",
  },
  {
    value: "C1",
    label: "C1",
    description: "Advanced - comfortable in any work setting",
  },
  { value: "C2", label: "C2", description: "Proficient - near-native" },
];

export const LOCATION_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "on_site", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
];

export const EMPLOYMENT_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
];

export const CURRENCY_OPTIONS = ["USD", "EUR", "UAH", "GBP"];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// Status constants

export const HiringRequestStatus = {
  ALL: "all",
  DRAFT: "draft",
  PENDING: "pending",
  IN_REVIEW: "in_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const HIRING_REQUEST_STATUS_META = {
  [HiringRequestStatus.DRAFT]: {
    label: "Draft",
    color: "gray",
  },
  [HiringRequestStatus.PENDING]: {
    label: "Pending",
    color: "yellow",
  },
  [HiringRequestStatus.IN_REVIEW]: {
    label: "In Review",
    color: "blue",
  },
  [HiringRequestStatus.APPROVED]: {
    label: "Approved",
    color: "green",
  },
  [HiringRequestStatus.REJECTED]: {
    label: "Rejected",
    color: "red",
  },
  [HiringRequestStatus.CANCELLED]: {
    label: "Cancelled",
    color: "gray",
  },
};

// Status display maps (legacy)

export const REQUEST_STATUS_COLOR = {
  draft: "gray",
  pending: "yellow",
  in_review: "blue",
  approved: "green",
  rejected: "red",
  cancelled: "gray",
};

export const REQUEST_STATUS_LABEL = {
  draft: "Draft",
  pending: "Pending",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const DASHBOARD_STATUS_COLOR = {
  pending: "yellow",
  in_review: "blue",
  approved: "green",
  rejected: "red",
  cancelled: "red",
};

export const DASHBOARD_STATUS_LABEL = {
  pending: "Pending",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
