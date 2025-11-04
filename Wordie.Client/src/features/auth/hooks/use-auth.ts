import { useCallback } from "react";

import { tokenStorage } from "@/lib/tokens";
import { useAppDispatch, useAppSelector } from "@/shared/store/hooks";

import { clearToken } from "../store/auth-slice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const logout = useCallback(() => {
    tokenStorage.clear();
    dispatch(clearToken());
  }, [dispatch]);

  return {
    token,
    isAuthenticated: Boolean(token),
    logout,
  };
}
