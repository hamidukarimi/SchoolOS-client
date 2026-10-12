import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiSuccess, SessionPayload } from "../features/auth/types";
import { getApiErrorMessage } from "./api-error";
import { shouldAttemptRefresh, singleFlight } from "./refresh-policy";
import { clearSession, setAuthenticated } from "./session-store";
import { getAccessToken } from "./token";

const baseURL = import.meta.env.VITE_API_BASE_URL;

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

async function requestRefresh(): Promise<string | null> {
  try {
    const response = await refreshClient.post<ApiSuccess<SessionPayload>>("/token");
    const accessToken = response.data.data?.accessToken;
    const user = response.data.data?.user;

    if (!accessToken || !user) {
      clearSession();
      return null;
    }

    setAuthenticated(user, accessToken);
    return accessToken;
  } catch {
    clearSession();
    return null;
  }
}

const refreshAccessToken = singleFlight(requestRefresh);

let bootstrapPromise: Promise<string | null> | null = null;

export function bootstrapSession(): Promise<string | null> {
  if (!bootstrapPromise) {
    bootstrapPromise = refreshAccessToken();
  }

  return bootstrapPromise;
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const parsed = getApiErrorMessage(error);

    if (
      !config ||
      !shouldAttemptRefresh({
        status: error.response?.status,
        url: config.url,
        method: config.method,
        message: parsed.message,
        alreadyRetried: Boolean(config._retry),
      })
    ) {
      return Promise.reject(error);
    }

    config._retry = true;
    const token = await refreshAccessToken();

    if (!token) {
      return Promise.reject(error);
    }

    config.headers.set("Authorization", `Bearer ${token}`);
    return http(config);
  },
);
