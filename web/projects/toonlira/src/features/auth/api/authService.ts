import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';
import { getStoredSession, persistSession, clearSession, setAccessToken, clearAccessToken, type StoredSession } from '@shared/service/session';
import type { User, UserRole } from '@entities/user';

export { getStoredSession };
export type { StoredSession };

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do api
// ---------------------------------------------------------------------------

/**
 * Resposta dos endpoints de auth. No transporte web, apenas o access token
 * vem no body; o refresh fica exclusivamente no cookie httpOnly. Os campos
 * continuam opcionais porque `/me` não devolve tokens e o mobile usa body.
 */
export type AuthResponse = StoredSession & {
    accessToken?: string | null;
    refreshToken?: string | null;
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

export type PasswordResetRequestResponse = {
    message: string;
    expiresInSeconds: number | null;
};

const COOKIE_REFRESH_CONFIG = {
    headers: { 'X-Refresh-Token-Transport': 'cookie' },
} as const;

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

/** Persiste apenas os dados não sensíveis; o access token vai para a memória. */
const storeAuth = (auth: AuthResponse): void => {
    const { accessToken, refreshToken: _refreshToken, ...session } = auth;

    persistSession(session);
    setAccessToken(accessToken ?? null);
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const signIn = async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(API_URLS.AUTH_SIGN_IN, data, COOKIE_REFRESH_CONFIG);

    const auth = response.data.data;
    storeAuth(auth);
    return auth;
};

export const signUp = async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>(API_URLS.AUTH_SIGN_UP, data, COOKIE_REFRESH_CONFIG);

    const auth = response.data.data;
    storeAuth(auth);
    return auth;
};

export const getCurrentUser = async (): Promise<AuthResponse | null> => {
    // Sem sessão persistida = nunca logou neste browser: não vale a pena
    // disparar /me + refresh (401 garantido para anônimos).
    if (!getStoredSession()) return null;

    try {
        // Se o access da memória expirou (ou é null pós-reload), o
        // interceptor faz o refresh silencioso via cookie httpOnly.
        const response = await api.get<ApiResponse<AuthResponse>>(API_URLS.AUTH_ME);
        return response.data.data;
    } catch {
        return null;
    }
};

export const signOut = async (): Promise<void> => {
    try {
        // Logout real: revoga a família de refresh tokens no servidor e
        // limpa o cookie httpOnly. Idempotente — o backend sempre responde 200.
        await api.post(API_URLS.AUTH_LOGOUT);
    } catch {
        // Mesmo se a rede falhar, o estado local é limpo.
    } finally {
        clearAccessToken();
        clearSession();
    }
};

export const requestPasswordReset = async (email: string): Promise<PasswordResetRequestResponse> => {
    const response = await api.post<ApiResponse<PasswordResetRequestResponse | string>>(API_URLS.AUTH_FORGOT_PASSWORD, { email });

    if (typeof response.data.data === 'string') {
        return { message: response.data.data, expiresInSeconds: null };
    }

    return response.data.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(API_URLS.AUTH_RESET_PASSWORD, { token, newPassword });

    return response.data.data;
};
