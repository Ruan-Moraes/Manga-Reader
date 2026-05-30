import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';
import { getStoredSession, persistSession, clearSession, type StoredSession } from '@shared/service/session';
import type { User, UserRole } from '@feature/user';

export { getStoredSession };
export type { StoredSession };

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do backend
// ---------------------------------------------------------------------------

export type AuthResponse = StoredSession;

export type SignInRequest = {
    email: string;
    password: string;
};

export type SignUpRequest = {
    name: string;
    email: string;
    password: string;
};

// ---------------------------------------------------------------------------
// Mapper — AuthResponse → User
// ---------------------------------------------------------------------------

const ROLE_MAP: Record<string, UserRole> = {
    ADMIN: 'admin',
    MODERATOR: 'poster',
    MEMBER: 'user',
};

export const mapAuthResponseToUser = (auth: AuthResponse): User => ({
    id: auth.userId,
    name: auth.name,
    photo: auth.photoUrl ?? '',
    role: ROLE_MAP[auth.role] ?? 'user',
    adultContentPreference: auth.adultContentPreference ?? 'BLUR',
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const signIn = async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(API_URLS.AUTH_SIGN_IN, data);

    const auth = response.data.data;
    persistSession(auth);
    return auth;
};

export const signUp = async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(API_URLS.AUTH_SIGN_UP, data);

    const auth = response.data.data;
    persistSession(auth);
    return auth;
};

export const refreshToken = async (token: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(API_URLS.AUTH_REFRESH, { refreshToken: token });

    const auth = response.data.data;
    persistSession(auth);
    return auth;
};

export const getCurrentUser = async (): Promise<AuthResponse | null> => {
    const session = getStoredSession();
    if (!session?.accessToken) return null;

    try {
        const response = await api.get<ApiResponse<AuthResponse>>(API_URLS.AUTH_ME);
        return response.data.data;
    } catch {
        return null;
    }
};

export const signOut = async (): Promise<void> => {
    clearSession();
};

export const requestPasswordReset = async (email: string): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(API_URLS.AUTH_FORGOT_PASSWORD, { email });

    return response.data.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(API_URLS.AUTH_RESET_PASSWORD, { token, newPassword });

    return response.data.data;
};
