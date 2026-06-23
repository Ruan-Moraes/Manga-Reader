import { api } from '@/src/shared/api';
import type { ApiResponse, AuthResponse, AuthTokens, LoginRequest, RegisterRequest, User, UserRole } from '@/src/shared/model';

interface AuthResult {
    user: User;
    accessToken: string;
    refreshToken: string;
}

/** Mapeia AuthResponse flat do backend para { user, tokens }. */
function toAuthResult(res: AuthResponse): AuthResult {
    return {
        user: {
            id: res.userId ?? '',
            name: res.name ?? '',
            email: res.email ?? '',
            role: (res.role as UserRole) ?? 'MEMBER',
            photoUrl: res.photoUrl ?? undefined,
            adultContentPreference: res.adultContentPreference ?? undefined,
        },
        accessToken: res.accessToken ?? '',
        refreshToken: res.refreshToken ?? '',
    };
}

export const authService = {
    login: async (data: LoginRequest): Promise<AuthResult> => {
        const res = await api.post<ApiResponse<AuthResponse>>('/auth/sign-in', data);
        return toAuthResult(res.data.data);
    },

    register: async (data: RegisterRequest): Promise<AuthResult> => {
        const res = await api.post<ApiResponse<AuthResponse>>('/auth/sign-up', data);
        return toAuthResult(res.data.data);
    },

    me: async (): Promise<User> => {
        const res = await api.get<ApiResponse<AuthResponse>>('/auth/me');
        return toAuthResult(res.data.data).user;
    },

    forgotPassword: async (email: string): Promise<void> => {
        await api.post('/auth/forgot-password', { email });
    },
};

export type { AuthResult, AuthTokens };
