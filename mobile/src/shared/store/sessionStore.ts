import { create } from 'zustand';

import { tokenStorage } from '@/src/shared/api';
import type { AuthState, AuthTokens, User } from '@/src/shared/model';

interface SessionActions {
    login: (user: User, tokens: AuthTokens) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
    hydrate: () => Promise<void>;
}

export const useSessionStore = create<AuthState & SessionActions>(set => ({
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
