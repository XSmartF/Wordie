import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { tokenStorage } from "@/lib/tokens";

type AuthState = {
  token: string | null;
};

const initialState: AuthState = {
  token: tokenStorage.get(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    clearToken(state) {
      state.token = null;
    },
  },
});

export const { setToken, clearToken } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
