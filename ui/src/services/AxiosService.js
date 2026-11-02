import axios, { AxiosHeaders } from "axios";
import { RefreshTokenService } from "./RefreshTokenService";
import { ROUTES } from "../routes/routes";
import { useAuthStore } from "../stores/useAuthStore";
import * as Sentry from "@sentry/react";
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const api = axios.create({
  withCredentials: true,
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

const refreshTokenInstance = axios.create({
  baseURL: API_URL,
});

export const axiosRefTokenInst = refreshTokenInstance;

refreshTokenInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    useAuthStore.getState().logout();

    const publicPaths = [
      ROUTES.LOGIN,
      ROUTES.FORGOT_PASSWORD,
      ROUTES.RESET_PASSWORD,
      ROUTES.ACCEPT,
    ];
    if (!publicPaths.includes(window.location.pathname)) {
      window.location.replace(ROUTES.LOGIN);
    }

    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;
    const errStatus = err.response?.status;

    if (errStatus >= 500) {
      console.error(
        `Server error (${errStatus}) for ${originalConfig.url}. Please try again later.`,
        err,
      );
      Sentry.captureException(err);
    }

    if (errStatus !== 401 || !originalConfig) {
      return Promise.reject(err);
    }

    if (originalConfig._retry) {
      return Promise.reject(err);
    }

    originalConfig._retry = true;

    const result = await RefreshTokenService.refreshToken();

    if (result?.accessToken) {
      originalConfig.headers = AxiosHeaders.from(originalConfig.headers);
      originalConfig.headers.set(
        "Authorization",
        `Bearer ${result.accessToken}`,
      );

      return api(originalConfig);
    }

    return Promise.reject(err);
  },
);

const getData = (res) => res.data;

export const apiClient = {
  get: (url, config) => api.get(url, config).then(getData),

  post: (url, data, config) => api.post(url, data, config).then(getData),

  patch: (url, data, config) => api.patch(url, data, config).then(getData),

  put: (url, data, config) => api.put(url, data, config).then(getData),

  delete: (url, config) => api.delete(url, config).then(getData),
};

export default api;
