import { create } from 'zustand';

import type { User } from '@/entities/user/@x/session';
import { tokenStorage } from '@/shared/api';

export interface SessionTokens {
    accessToken: string;
    refreshToken: string;
}

export interface SessionState {
    user: User | null;
    tokens: SessionTokens | null;
    isAuthenticated: boolean;
    identityEpoch: number;
}

const initialState: SessionState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    identityEpoch: 0,
};

export const useSessionStore = create<SessionState>(() => initialState);

/**
 * Escritas de sessão ficam agrupadas para que features de autenticação controlem
 * as transições; superfícies de UI devem consumir apenas useSessionStore.
 */
export const sessionTransitions = {
    restore: async (): Promise<void> => {
        const accessToken = await tokenStorage.getAccess();
        const refreshToken = await tokenStorage.getRefresh();

        if (accessToken && refreshToken) {
            useSessionStore.setState(state => ({
                tokens: { accessToken, refreshToken },
                isAuthenticated: true,
                identityEpoch: state.identityEpoch + 1,
            }));
        }
    },

    start: async (user: User, tokens: SessionTokens): Promise<void> => {
        await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
        useSessionStore.setState(state => ({
            user,
            tokens,
            isAuthenticated: true,
            identityEpoch: state.identityEpoch + 1,
        }));
    },

    clear: async (): Promise<void> => {
        try {
            await tokenStorage.clear();
        } finally {
            useSessionStore.setState(state => ({
                user: null,
                tokens: null,
                isAuthenticated: false,
                identityEpoch: state.identityEpoch + 1,
            }));
        }
    },

    setUser: (user: User): void => useSessionStore.setState({ user }),
};
