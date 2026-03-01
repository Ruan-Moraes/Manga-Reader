import {
    simulateDelay,
    getFromStorage,
    saveToStorage,
    removeFromStorage,
    ok,
    fail,
} from '@shared/service/mockApi';

import type { MockApiResponse } from '@shared/service/mockApi';

import { mockUsers } from '@mock/data/users';

import { type User, type UserRole } from '@feature/user';

import { AUTH_KEY } from '@feature/auth/constant/AUTH_KEY';

const fallbackUser = mockUsers[0];

const usersByRole: Record<UserRole, User> = {
    user: mockUsers.find(user => user.role === 'user') ?? fallbackUser,
    poster: mockUsers.find(user => user.role === 'poster') ?? fallbackUser,
    admin: mockUsers.find(user => user.role === 'admin') ?? fallbackUser,
};

export const getCurrentUserSync = (): User | null =>
    getFromStorage<User | null>(AUTH_KEY, null);

export const getCurrentUser = async (): Promise<User | null> => {
    await simulateDelay(100);

    return getCurrentUserSync();
};

export const signIn = async (): Promise<User> => {
    await simulateDelay(300);

    const user = usersByRole.user;

    saveToStorage(AUTH_KEY, user);

    return user;
};

export const signInAs = async (role: UserRole): Promise<User> => {
    await simulateDelay(120);

    const user = usersByRole[role] ?? usersByRole.user;

    saveToStorage(AUTH_KEY, user);

    return user;
};

export const signOut = async (): Promise<void> => {
    removeFromStorage(AUTH_KEY);
};

export const requestPasswordReset = async (
    _email: string,
): Promise<MockApiResponse<null>> => {
    await simulateDelay(500);
    void _email;

    return ok(null, 'Email de recuperação enviado com sucesso!');
};

export const resetPassword = async (
    token: string,
    _newPassword: string,
): Promise<MockApiResponse<null>> => {
    await simulateDelay(500);
    void _newPassword;

    if (!token) {
        return fail(null, 'Token de recuperação inválido ou expirado.');
    }

    return ok(null, 'Senha redefinida com sucesso!');
};
