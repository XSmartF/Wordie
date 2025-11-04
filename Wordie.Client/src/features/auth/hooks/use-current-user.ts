import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { type ApiError } from "@/shared/api/http-client";

import { authApi } from "../api/auth-api";
import type { UserProfile } from "../types";
import { useAuth } from "./use-auth";

const queryKey = ["auth", "me"] as const;

type CurrentUserQueryOptions = UseQueryOptions<UserProfile, ApiError>;

export function useCurrentUserQuery(options?: CurrentUserQueryOptions) {
  const { token } = useAuth();

  return useQuery<UserProfile, ApiError>({
    queryKey,
    queryFn: authApi.me,
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
}

export { queryKey as currentUserQueryKey };
