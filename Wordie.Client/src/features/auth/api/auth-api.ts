import { httpClient } from "@/shared/api/http-client";

import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from "../types";

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await httpClient.post<AuthResponse>("/auth/login", credentials);
    return data;
  },
  me: async (): Promise<UserProfile> => {
    const { data } = await httpClient.get<UserProfile>("/auth/me");
    return data;
  },
  register: async (userData: RegisterRequest): Promise<void> => {
    await httpClient.post("/auth/register", userData);
  },
};
