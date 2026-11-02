import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/useAuthStore";
import { ROUTES } from "../routes";

const GuestRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const isAuthChecking = useAuthStore((state) => state.isAuthChecking);

  if (isAuthChecking) {
    return null;
  }

  if (isAuthenticated && user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
