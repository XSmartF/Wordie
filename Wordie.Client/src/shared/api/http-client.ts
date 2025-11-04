import axios, { AxiosHeaders, type AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import { tokenStorage } from "@/lib/tokens";
import { clearToken } from "@/features/auth/store/auth-slice";
import { store } from "@/shared/store";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
    skipAuthClear?: boolean;
  }
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  errors?: Record<string, string[] | string>;
}

export type ApiError<T = ApiErrorPayload> = AxiosError<T>;

export const httpClient = axiosInstance;

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    const headers = config.headers;

    if (headers instanceof AxiosHeaders) {
      headers.set("Authorization", `Bearer ${token}`);
    } else if (headers) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    } else {
      config.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
    }
  }
  return config;
});

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: ApiError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const config = error?.config as (typeof error.config & {
      skipErrorToast?: boolean;
      skipAuthClear?: boolean;
    }) | null;

    if (error.response?.status === 401 && !config?.skipAuthClear) {
      tokenStorage.clear();
      store.dispatch(clearToken());
    }

    if (!config?.skipErrorToast) {
      toast.error(extractErrorMessage(error), { duration: 3500 });
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data;
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors) {
      const firstError = Object.values(data.errors)[0];
      if (Array.isArray(firstError)) {
        return firstError[0] ?? "Unexpected error. Please try again.";
      }
      if (typeof firstError === "string") {
        return firstError;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error. Please try again.";
}
