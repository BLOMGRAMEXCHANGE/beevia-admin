import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearSession,
  getAccessToken,
  setAccessToken,
} from "@/lib/token-store";
import { mockAdapter } from "@/mocks/adapter";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const REFRESH_ENDPOINT_PATH = "/auth/refresh";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  adapter: USE_MOCKS ? mockAdapter : undefined,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        `${API_BASE_URL}${REFRESH_ENDPOINT_PATH}`,
        undefined,
        { withCredentials: true, adapter: USE_MOCKS ? mockAdapter : undefined }
      )
      .then((response) => {
        const { accessToken } = response.data;
        setAccessToken(accessToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function redirectToLogin() {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };
        return apiClient.request(originalRequest);
      } catch (refreshError) {
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
