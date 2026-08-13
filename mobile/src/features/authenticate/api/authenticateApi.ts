import type { User, UserRole } from '@/src/entities/user';
import { api, tokenStorage } from '@/src/shared/api';
import type { ApiResponse } from '@/src/shared/model';

export interface SignInRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}

interface AuthenticationResponse {
    accessToken: string | null;
    refreshToken: string | null;
    userId: string | null;
    name: string | null;
    email: string | null;
    role: string | null;
    photoUrl: string | null;
    adultContentPreference: string | null;
}

export interface AuthenticationResult {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface PasswordResetRequestResponse {
    message: string;
    expiresInSeconds: number | null;
}

function toAuthenticationResult(response: AuthenticationResponse): AuthenticationResult {
    const user = toUser(response);
    const requiredString = (value: string | null): string | null => (typeof value === 'string' && value.trim().length > 0 ? value : null);
    const accessToken = requiredString(response.accessToken);
    const refreshToken = requiredString(response.refreshToken);
    if (!accessToken || !refreshToken) {
        throw new Error('Invalid authentication response');
    }

    return { user, accessToken, refreshToken };
}

function toUser(response: AuthenticationResponse): User {
    const requiredString = (value: string | null): string | null => (typeof value === 'string' && value.trim().length > 0 ? value : null);
    const userId = requiredString(response.userId);
    const name = requiredString(response.name);
    const email = requiredString(response.email);
    if (!userId || !name || !email) {
        throw new Error('Invalid authentication response');
    }
    if (response.role !== 'MEMBER' && response.role !== 'ADMIN' && response.role !== 'MODERATOR') {
        throw new Error('Invalid authentication response');
    }

    return {
        id: userId,
        name,
        email,
        role: response.role as UserRole,
        photoUrl: response.photoUrl ?? undefined,
        adultContentPreference: response.adultContentPreference ?? undefined,
    };
}

export const authenticateApi = {
    signIn: async (data: SignInRequest): Promise<AuthenticationResult> => {
        const response = await api.post<ApiResponse<AuthenticationResponse>>('/auth/sign-in', data);
        return toAuthenticationResult(response.data.data);
    },

    signUp: async (data: SignUpRequest): Promise<AuthenticationResult> => {
        const response = await api.post<ApiResponse<AuthenticationResponse>>('/auth/sign-up', data);
        return toAuthenticationResult(response.data.data);
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<ApiResponse<AuthenticationResponse>>('/auth/me');
        return toUser(response.data.data);
    },

    requestPasswordReset: async (email: string): Promise<PasswordResetRequestResponse> => {
        const response = await api.post<ApiResponse<PasswordResetRequestResponse | string>>('/auth/forgot-password', { email });
        return typeof response.data.data === 'string' ? { message: response.data.data, expiresInSeconds: null } : response.data.data;
    },

    signOut: async (): Promise<void> => {
        try {
            const refreshToken = await tokenStorage.getRefresh();
            await api.post('/auth/logout', refreshToken ? { refreshToken } : undefined);
        } catch {
            // A saída local continua mesmo sem rede; o token expira no servidor.
        }
    },
};
