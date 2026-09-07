import { sessionTransitions, useSessionStore } from '@/entities/session';
import type { User } from '@/entities/user';

import { authenticateApi, type PasswordResetRequestResponse, type SignInRequest, type SignUpRequest } from '../api/authenticateApi';

export async function signIn(request: SignInRequest): Promise<void> {
    const result = await authenticateApi.signIn(request);
    await sessionTransitions.start(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
}

export async function signUp(request: SignUpRequest): Promise<void> {
    const result = await authenticateApi.signUp(request);
    await sessionTransitions.start(result.user, { accessToken: result.accessToken, refreshToken: result.refreshToken });
}

export function requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
    return authenticateApi.requestPasswordReset(email);
}

export function restoreSession(): Promise<void> {
    return sessionTransitions.restore();
}

export async function signOut(): Promise<void> {
    try {
        await authenticateApi.signOut();
    } finally {
        await sessionTransitions.clear();
    }
}

export function clearExpiredSession(): Promise<void> {
    return sessionTransitions.clear();
}

export async function loadCurrentUser(identityEpoch: number): Promise<User | null> {
    const user = await authenticateApi.getCurrentUser();
    if (useSessionStore.getState().identityEpoch !== identityEpoch) return null;
    sessionTransitions.setUser(user);
    return user;
}
