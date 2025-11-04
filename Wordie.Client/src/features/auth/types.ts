export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  displayName?: string | null;
}
