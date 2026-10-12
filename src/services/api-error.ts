import axios from "axios";

export interface ParsedApiError {
  message: string;
  errors: string[];
  status?: number;
}

export function getApiErrorMessage(error: unknown): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    return {
      message: "Something went wrong. Please try again.",
      errors: [],
    };
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return { message: data, errors: [], status };
  }

  if (data && typeof data === "object") {
    const record = data as { message?: unknown; errors?: unknown };
    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message
        : "Request failed.";
    const errors = Array.isArray(record.errors)
      ? record.errors.filter((item): item is string => typeof item === "string")
      : [];

    return { message, errors, status };
  }

  if (error.code === "ERR_NETWORK") {
    return {
      message:
        "Could not reach the server. Check that the API is running and that CLIENT_URL matches this site.",
      errors: [],
      status,
    };
  }

  return {
    message: "Something went wrong. Please try again.",
    errors: [],
    status,
  };
}
