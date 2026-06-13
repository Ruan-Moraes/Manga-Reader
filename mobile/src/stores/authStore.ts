import { create } from 'zustand';
import { AuthState, AuthTokens, User } from '@/src/types/auth';
import { tokenStorage } from '@/src/services/api';

interface AuthActions {
    login: (user: User, tokens: AuthTokens) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>(set => ({
    user: null,
    tokens: null,
    isAuthenticated: false,

    hydrate: async () => {
        const accessToken = await tokenStorage.getAccess();

        const refreshToken = await tokenStorage.getRefresh();

        if (accessToken && refreshToken) {
            set({ tokens: { accessToken, refreshToken }, isAuthenticated: true });
        }
    },

    login: async (user, tokens) => {
        await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);

        set({ user, tokens, isAuthenticated: true });
    },

    logout: async () => {
        await tokenStorage.clear();

        set({ user: null, tokens: null, isAuthenticated: false });
    },

    setUser: user => set({ user }),
}));
