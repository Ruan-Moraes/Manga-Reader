export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type UserRole = 'MEMBER' | 'ADMIN' | 'MODERATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: UserRole;
  adultContentPreference?: string;
}

/** Resposta flat do backend: /api/auth/sign-in | sign-up | refresh | me */
export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  photoUrl: string | null;
  adultContentPreference: string | null;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}
