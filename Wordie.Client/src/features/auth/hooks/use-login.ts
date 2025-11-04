import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { tokenStorage } from "@/lib/tokens";
import { extractErrorMessage, type ApiError } from "@/shared/api/http-client";
import { useAppDispatch } from "@/shared/store/hooks";

import { authApi } from "../api/auth-api";
import type { AuthResponse, LoginRequest } from "../types";
import { setToken } from "../store/auth-slice";

type LoginMutationCallbacks = {
  onSuccess?: (data: AuthResponse, variables: LoginRequest) => void;
  onError?: (error: ApiError) => void;
};

export function useLoginMutation(callbacks: LoginMutationCallbacks = {}) {
  const dispatch = useAppDispatch();

  return useMutation<AuthResponse, ApiError, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: (data, variables) => {
      tokenStorage.set(data.token);
      dispatch(setToken(data.token));
      toast.success("Signed in successfully");
      callbacks.onSuccess?.(data, variables);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
      callbacks.onError?.(error);
    },
  });
}
