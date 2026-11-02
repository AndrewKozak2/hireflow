import { defaultDropAnimation } from "@dnd-kit/core";

export const APPLICATION_SOURCE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "referral", label: "Referral" },
  { value: "djinni", label: "Djinni" },
  { value: "dou", label: "DOU" },
  { value: "linkedin", label: "LinkedIn" },
];

export const SOURCE_META = {
  djinni: { color: "green", label: "Djinni" },
  dou: { color: "blue", label: "DOU" },
  linkedin: { color: "indigo", label: "LinkedIn" },
  talent_pool: { color: "grape", label: "Talent Pool" },
  manual: { color: "gray", label: "Manual" },
  referral: { color: "cyan", label: "Referral" },
};

export const STAGES = [
  { id: "screening", label: "Screening" },
  { id: "pre_interview", label: "Pre-interview" },
  { id: "technical_interview", label: "Technical" },
  { id: "offer", label: "Offer" },
  { id: "hired", label: "Hired" },
  { id: "rejected", label: "Rejected" },
];

export const STAGE_MAPPING = {
  new: { label: "New", color: "gray" },
  screening: { label: "Screening", color: "blue" },
  pre_interview: { label: "Pre-Interview", color: "cyan" },
  technical_interview: { label: "Technical Interview", color: "indigo" },
  offer: { label: "Offer", color: "orange" },
  hired: { label: "Hired", color: "green" },
  rejected: { label: "Rejected", color: "red" },
};

export const dropAnimationConfig = {
  ...defaultDropAnimation,
};

export const REJECTION_REASONS = [
  { value: "salary_expectation", label: "Salary expectation" },
  { value: "skills_mismatch", label: "Skills mismatch" },
  { value: "culture_fit", label: "Culture fit" },
  { value: "withdrawn", label: "Candidate withdrawn" },
  { value: "other", label: "Other" },
];
