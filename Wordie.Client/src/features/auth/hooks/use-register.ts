import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractErrorMessage, type ApiError } from "@/shared/api/http-client";

import { authApi } from "../api/auth-api";
import type { RegisterRequest } from "../types";

type RegisterMutationCallbacks = {
  onSuccess?: (variables: RegisterRequest) => void;
  onError?: (error: ApiError) => void;
};

export function useRegisterMutation(callbacks: RegisterMutationCallbacks = {}) {
  return useMutation<void, ApiError, RegisterRequest>({
    mutationFn: authApi.register,
    onSuccess: (_, variables) => {
      toast.success("Account created successfully");
      callbacks.onSuccess?.(variables);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
      callbacks.onError?.(error);
    },
  });
}
