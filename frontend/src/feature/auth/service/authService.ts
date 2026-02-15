import {
    simulateDelay,
    getFromStorage,
    saveToStorage,
    removeFromStorage,
} from '@shared/service/mockApi';
import { mockUsers } from '@mock/data/users';

import { type User } from '../type/user.types';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const AUTH_KEY = 'manga-reader:auth-user';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getCurrentUser = async (): Promise<User | null> => {
    await simulateDelay(100);
    return getFromStorage<User | null>(AUTH_KEY, null);
};

export const signIn = async (): Promise<User> => {
    await simulateDelay(300);

    const user = mockUsers[0]; // "Leitor Demo"
    saveToStorage(AUTH_KEY, user);

    return user;
};

export const signOut = async (): Promise<void> => {
    await simulateDelay(100);
    removeFromStorage(AUTH_KEY);
};

export const updateProfile = async (
    partial: Partial<User>,
): Promise<User | null> => {
    await simulateDelay(200);

    const current = getFromStorage<User | null>(AUTH_KEY, null);

    if (!current) return null;

    const updated = { ...current, ...partial };
    saveToStorage(AUTH_KEY, updated);

    return updated;
};
