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

import { type User } from '@feature/user';

import { AUTH_KEY } from '@feature/auth/constant/AUTH_KEY';

export const getCurrentUser = async (): Promise<User | null> => {
    await simulateDelay(100);

    return getFromStorage<User | null>(AUTH_KEY, null);
};

export const signIn = async (): Promise<User> => {
    await simulateDelay(300);

    // TODO: Implementar a autenticação real
    const user = mockUsers[0];

    saveToStorage(AUTH_KEY, user);

    return user;
};

export const signOut = async (): Promise<void> => {
    // TODO: Implementar a desautenticação real
    removeFromStorage(AUTH_KEY);
};

export const requestPasswordReset = async (
    _email: string,
): Promise<MockApiResponse<null>> => {
    await simulateDelay(500);

    // TODO: Validar email no backend real
    // Mock sempre retorna sucesso para simular o envio do email
    return ok(null, 'Email de recuperação enviado com sucesso!');
};

export const resetPassword = async (
    token: string,
    _newPassword: string,
): Promise<MockApiResponse<null>> => {
    await simulateDelay(500);

    // TODO: Validar token real e atualizar senha no backend
    if (!token) {
        return fail(null, 'Token de recuperação inválido ou expirado.');
    }

    return ok(null, 'Senha redefinida com sucesso!');
};
