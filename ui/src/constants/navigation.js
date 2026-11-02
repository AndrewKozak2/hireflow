import { ROLES } from "./roles";
import { ROUTES } from "../routes/routes";
import {
  IconLayoutDashboard,
  IconBriefcase,
  IconFileDescription,
  IconUsers,
  IconClipboardText,
  IconChartBar,
  IconSettings,
} from "@tabler/icons-react";

export const NAVIGATION_LINKS = [
  {
    label: "Dashboard",
    path: ROUTES.DASHBOARD,
    allowedRoles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.MANAGER],
    icon: IconLayoutDashboard,
  },
  {
    label: "Jobs",
    path: ROUTES.JOBS,
    allowedRoles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.MANAGER],
    icon: IconBriefcase,
  },
  {
    label: "Hiring Requests",
    path: ROUTES.HIRING_REQUESTS,
    allowedRoles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.MANAGER],
    icon: IconClipboardText,
  },
  {
    label: "Applications",
    path: ROUTES.APPLICATIONS,
    allowedRoles: [ROLES.ADMIN, ROLES.RECRUITER],
    icon: IconFileDescription,
    badge: null,
  },
  {
    label: "Candidates",
    path: ROUTES.CANDIDATES,
    allowedRoles: [ROLES.ADMIN, ROLES.RECRUITER],
    icon: IconUsers,
  },
  {
    label: "Analytics",
    path: ROUTES.ANALYTICS,
    allowedRoles: [ROLES.ADMIN, ROLES.RECRUITER, ROLES.MANAGER],
    icon: IconChartBar,
  },
  {
    label: "Settings",
    path: ROUTES.SETTING,
    allowedRoles: [ROLES.ADMIN],
    icon: IconSettings,
  },
];
