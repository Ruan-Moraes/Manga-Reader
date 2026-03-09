import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do backend
// ---------------------------------------------------------------------------

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    photoUrl?: string;
};

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
// Storage keys
// ---------------------------------------------------------------------------

const AUTH_STORAGE_KEY = 'manga-reader:auth-user';

// ---------------------------------------------------------------------------
// Helpers — sessão local
// ---------------------------------------------------------------------------

const persistSession = (auth: AuthResponse): void => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

const clearSession = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getStoredSession = (): AuthResponse | null => {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
        return null;
    }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const signIn = async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
        API_URLS.AUTH_SIGN_IN,
        data,
    );

    const auth = response.data.data;
    persistSession(auth);
    return auth;
};

export const signUp = async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
        API_URLS.AUTH_SIGN_UP,
        data,
    );

    const auth = response.data.data;
    persistSession(auth);
    return auth;
};

export const refreshToken = async (token: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
        API_URLS.AUTH_REFRESH,
        { refreshToken: token },
    );

    const auth = response.data.data;
    persistSession(auth);
    return auth;
};

export const getCurrentUser = async (): Promise<AuthResponse | null> => {
    const session = getStoredSession();
    if (!session?.accessToken) return null;

    try {
        const response = await api.get<ApiResponse<AuthResponse>>(
            API_URLS.AUTH_ME,
        );
        return response.data.data;
    } catch {
        return null;
    }
};

export const signOut = async (): Promise<void> => {
    clearSession();
};

export const requestPasswordReset = async (email: string): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
        API_URLS.AUTH_FORGOT_PASSWORD,
        { email },
    );

    return response.data.data;
};

export const resetPassword = async (
    token: string,
    newPassword: string,
): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
        API_URLS.AUTH_RESET_PASSWORD,
        { token, newPassword },
    );

    return response.data.data;
};
