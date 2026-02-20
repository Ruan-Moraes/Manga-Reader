import {
    simulateDelay,
    getFromStorage,
    saveToStorage,
} from '@shared/service/mockApi';

import { AUTH_KEY } from '@feature/auth/constant/AUTH_KEY';

import { type User } from '../type/user.types';

export const updateProfile = async (
    partial: Partial<User>,
): Promise<User | null> => {
    await simulateDelay(200);

    const current = getFromStorage<User | null>(AUTH_KEY, null);

    if (!current) return null;

    const updated = { ...current, ...partial };

    saveToStorage(AUTH_KEY, updated);

    // TODO: Implementar a atualização de perfil real, incluindo a persistência no backend
    // TODO: [Implementar chamada à API para atualizar o perfil do usuário]

    return updated;
};
