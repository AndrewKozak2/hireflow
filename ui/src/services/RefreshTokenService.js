import { axiosRefTokenInst } from "./AxiosService";
import { useAuthStore } from "../stores/useAuthStore";

export const RefreshTokenService = {
  refreshToken: async () => {
    const setAccessToken = useAuthStore.getState().setAccessToken;

    const response = await axiosRefTokenInst.post(
      "/auth/refresh",
      {},
      {
        withCredentials: true,
      },
    );

    if (response?.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    return response?.data;
  },
};
