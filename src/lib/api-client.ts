import axios, { type InternalAxiosRequestConfig } from "axios";
import { clearSession, getAccessToken } from "@/lib/token-store";
import { mockAdapter } from "@/mocks/adapter";

const API_BASE_URL = process.env.API_BASE_URL ?? "";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

function attachAuthInterceptors(client: ReturnType<typeof axios.create>) {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearSession();
        if (typeof window !== "undefined") {
          window.location.assign("/login");
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/** Used for endpoints not yet built on the backend; can be routed through fixture data via NEXT_PUBLIC_USE_MOCKS. */
export const apiClient = attachAuthInterceptors(
  axios.create({
    baseURL: API_BASE_URL,
    adapter: USE_MOCKS ? mockAdapter : undefined,
  })
);

/** Always talks to the real backend, regardless of NEXT_PUBLIC_USE_MOCKS — for endpoints already live (e.g. admin auth). */
export const liveClient = attachAuthInterceptors(
  axios.create({ baseURL: API_BASE_URL })
);
