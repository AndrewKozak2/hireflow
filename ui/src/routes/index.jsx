import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import ProtectedRoute from "./guards/ProtectedRoute";
import GuestRoute from "./guards/GuestRoute";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { GlobalErrorPage } from "../pages/GlobalErrorPage/GlobalErrorPage";
import AddApplicationTestPage from "../pages/AddApplicationTest";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <GlobalErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.DASHBOARD} replace />,
          },
          {
            path: ROUTES.DASHBOARD,
            async lazy() {
              let { default: DashboardPage } =
                await import("../pages/DashboardPage/DashboardPage");
              return { Component: DashboardPage };
            },
          },
          {
            element: (
              <ProtectedRoute allowedRoles={["admin", "hiring_manager"]} />
            ),
            children: [
              {
                path: ROUTES.HIRING_REQUESTS_NEW,
                async lazy() {
                  let { default: NewHiringRequestPage } =
                    await import("../pages/HiringRequestsPage/NewHiringRequest/NewHiringRequestPage");
                  return { Component: NewHiringRequestPage };
                },
              },
              {
                path: ROUTES.HIRING_REQUESTS_DRAFT_EDIT,
                async lazy() {
                  let { default: DraftHiringRequestPage } =
                    await import("../pages/HiringRequestsPage/DraftHiringRequestPage/DraftHiringRequestPage");
                  return { Component: DraftHiringRequestPage };
                },
              },
            ],
          },
          {
            element: (
              <ProtectedRoute
                allowedRoles={["admin", "hiring_manager", "recruiter"]}
              />
            ),
            children: [
              {
                path: ROUTES.HIRING_REQUEST_DETAIL,
                async lazy() {
                  let { default: HiringRequestDetailDispatch } =
                    await import("../pages/HiringRequestDetailManagerPage/HiringRequestDetailDispatch");
                  return { Component: HiringRequestDetailDispatch };
                },
              },
            ],
          },
          {
            path: ROUTES.JOBS,
            async lazy() {
              let { default: JobsPage } =
                await import("../pages/JobsPage/JobsPage");
              return { Component: JobsPage };
            },
          },
          {
            element: (
              <ProtectedRoute
                allowedRoles={["admin", "recruiter", "hiring_manager"]}
              />
            ),
            children: [
              {
                path: ROUTES.HIRING_REQUESTS,
                async lazy() {
                  let { default: HiringRequestsPage } =
                    await import("../pages/HiringRequestsPage/HiringRequestsPage");
                  return { Component: HiringRequestsPage };
                },
              },
              {
                path: ROUTES.JOB_DETAIL,
                async lazy() {
                  let { default: JobDetailPage } =
                    await import("../pages/JobsPage/JobDetailPage");
                  return { Component: JobDetailPage };
                },
              },
              {
                path: ROUTES.ANALYTICS,
                async lazy() {
                  let { default: AnalyticsPage } =
                    await import("../pages/AnalyticsPage/AnalyticsPage");
                  return { Component: AnalyticsPage };
                },
              },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={["admin", "recruiter"]} />,
            children: [
              {
                path: ROUTES.CANDIDATE_DETAIL,
                async lazy() {
                  let { default: CandidateProfilePage } =
                    await import("../pages/CandidateProfilePage/CandidateProfilePage");
                  return { Component: CandidateProfilePage };
                },
              },
              {
                path: ROUTES.HIRING_REQUEST_DETAIL,
                async lazy() {
                  let { default: HiringRequestDetailPage } =
                    await import("../pages/HiringRequestDetailPage/HiringRequestDetailPage");
                  return { Component: HiringRequestDetailPage };
                },
              },
              {
                path: ROUTES.NEW_JOBS,
                async lazy() {
                  let { default: NewJobPage } =
                    await import("../pages/JobsPage/JobCreationForm");
                  return { Component: NewJobPage };
                },
              },
              {
                path: ROUTES.EDIT_JOB,
                async lazy() {
                  let { default: EditJobPage } =
                    await import("../pages/JobsPage/JobCreationForm");
                  return { Component: EditJobPage };
                },
              },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={["admin", "recruiter"]} />,
            children: [
              {
                path: ROUTES.CANDIDATES,
                async lazy() {
                  let { default: CandidatesListPage } =
                    await import("../pages/CandidatesPage/CandidatesListPage");
                  return { Component: CandidatesListPage };
                },
              },
              {
                path: ROUTES.APPLICATIONS,
                async lazy() {
                  let { default: ApplicationsListPage } =
                    await import("../pages/ApplicationsPage/ApplicationsPage");
                  return { Component: ApplicationsListPage };
                },
              },
              {
                path: ROUTES.APPLICATION_DETAIL,
                async lazy() {
                  let { default: ApplicationDetail } =
                    await import("../pages/ApplicationsPage/ApplicationDetail");
                  return { Component: ApplicationDetail };
                },
              },
              {
                path: ROUTES.CANDIDATE_DETAIL,
                element: <div>Candidate Detail (Coming Soon)</div>,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [
              {
                path: ROUTES.INVITE,
                async lazy() {
                  let { default: InviteUserPage } =
                    await import("../pages/Auth/InviteUserPage");
                  return { Component: InviteUserPage };
                },
              },
              {
                path: ROUTES.SETTING,
                async lazy() {
                  let { default: SettingsLayout } =
                    await import("../layouts/SettingsLayout");
                  return { Component: SettingsLayout };
                },
                children: [
                  {
                    index: true,
                    element: <Navigate to={ROUTES.SETTING_TEAM} replace />,
                  },
                  {
                    path: "team",
                    async lazy() {
                      let { default: TeamPage } =
                        await import("../pages/TeamManagementPage/TeamPage");
                      return { Component: TeamPage };
                    },
                  },
                  {
                    path: "email",
                    async lazy() {
                      let { EmailSettingsPage } =
                        await import("../pages/SettingsPage/EmailSettingsPage");
                      return { Component: EmailSettingsPage };
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <GlobalErrorPage />,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            path: ROUTES.LOGIN,
            async lazy() {
              let { LoginPage } = await import("../pages/LoginPage/LoginPage");
              return { Component: LoginPage };
            },
          },
        ],
      },
      {
        path: ROUTES.ACCEPT,
        async lazy() {
          let { default: AcceptInvitePage } =
            await import("../pages/Auth/AcceptInvitePage");
          return { Component: AcceptInvitePage };
        },
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        async lazy() {
          let { default: ForgotPassword } =
            await import("../pages/ForgotPasswordPage/ForgotPassword");
          return { Component: ForgotPassword };
        },
      },
      {
        path: ROUTES.RESET_PASSWORD,
        async lazy() {
          let { default: ResetPassword } =
            await import("../pages/ResetPasswordPage/ResetPassword");
          return { Component: ResetPassword };
        },
      },
    ],
  },
  {
    path: ROUTES.UNAUTHORIZED,
    async lazy() {
      let { UnauthorizedPage } =
        await import("../pages/UnauthorizedPage/UnauthorizedPage");
      return { Component: UnauthorizedPage };
    },
  },
  {
    path: ROUTES.NOT_FOUND,
    async lazy() {
      let { NotFoundPage } = await import("../pages/NotFoundPage/NotFoundPage");
      return { Component: NotFoundPage };
    },
  },
  {
    path: ROUTES.ERROR,
    element: <GlobalErrorPage />,
  },
  {
    path: "/test-app-form",
    element: <AddApplicationTestPage />,
  },
]);
