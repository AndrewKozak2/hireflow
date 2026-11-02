import { AuthService } from "../services/AuthService";
import { useAuthStore } from "../stores/useAuthStore";
import { useNotifications } from "../hooks/useNotifications";

export const useAuth = () => {
  const user = useAuthStore((s) => s.user);
  const { onError, onSuccess } = useNotifications();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setIsAuthChecking = useAuthStore((s) => s.setIsAuthChecking);

  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const logoutStore = useAuthStore((s) => s.logout);

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.warn("Session cleared or logout failed:", error.message);
    } finally {
      logoutStore();
    }
  };

  const fetchUser = async () => {
    try {
      const userData = await AuthService.fetchUser();

      if (!userData) {
        await logout();
        return;
      }

      setUser(userData);
    } catch {
      await logout();
    } finally {
      setIsAuthChecking(false);
    }
  };

  const login = async ({ email, password }) => {
    try {
      const { accessToken } = await AuthService.login(email, password);
      setAccessToken(accessToken);
      await fetchUser();
    } catch (error) {
      onError({ message: "Login error:" + error.message });
      throw error;
    }
  };

  const acceptInvite = async (data) => {
    try {
      const response = await AuthService.acceptInvite(data);
      if (response?.accessToken) {
        setAccessToken(response.accessToken);
        await fetchUser();
      }
      return response;
    } catch (e) {
      onError({
        message: e.response?.data?.message || "Failed to accept invite",
      });
      throw e;
    }
  };

  const revokeInvite = async (email) => {
    try {
      const response = await AuthService.revokeInvite(email);
      onSuccess({ message: "Invitation revoked successfully" });
      return response;
    } catch (e) {
      onError({
        message: e.response?.data?.message || "Failed to revoke invitation",
      });
      throw e;
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    fetchUser,
    acceptInvite,
    revokeInvite,
  };
};
