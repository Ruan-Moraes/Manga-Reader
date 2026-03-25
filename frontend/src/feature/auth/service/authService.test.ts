import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    signIn,
    signUp,
    refreshToken,
    getCurrentUser,
    signOut,
    requestPasswordReset,
    resetPassword,
    getStoredSession,
    mapAuthResponseToUser,
    type AuthResponse,
} from './authService';

const buildAuthResponse = (
    overrides: Partial<AuthResponse> = {},
): AuthResponse => ({
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    userId: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'MEMBER',
    photoUrl: 'https://example.com/photo.jpg',
    ...overrides,
});

describe('authService', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('signIn', () => {
        it('deve retornar auth response e persistir sessao', async () => {
            const authData = buildAuthResponse();

            server.use(
                http.post(`*${API_URLS.AUTH_SIGN_IN}`, () =>
                    HttpResponse.json({ data: authData, success: true }),
                ),
            );

            const result = await signIn({
                email: 'test@example.com',
                password: '123456',
            });

            expect(result.accessToken).toBe('access-token-123');
            expect(result.userId).toBe('user-1');

            const stored = getStoredSession();
            expect(stored?.accessToken).toBe('access-token-123');
        });

        it('deve propagar erro quando API falha', async () => {
            server.use(
                http.post(`*${API_URLS.AUTH_SIGN_IN}`, () =>
                    HttpResponse.json(null, { status: 401 }),
                ),
            );

            await expect(
                signIn({ email: 'test@example.com', password: 'wrong' }),
            ).rejects.toThrow();
        });
    });

    describe('signUp', () => {
        it('deve retornar auth response e persistir sessao', async () => {
            const authData = buildAuthResponse({ name: 'New User' });

            server.use(
                http.post(`*${API_URLS.AUTH_SIGN_UP}`, () =>
                    HttpResponse.json({ data: authData, success: true }),
                ),
            );

            const result = await signUp({
                name: 'New User',
                email: 'new@example.com',
                password: '123456',
            });

            expect(result.name).toBe('New User');
            expect(getStoredSession()?.name).toBe('New User');
        });
    });

    describe('refreshToken', () => {
        it('deve retornar novo auth response e atualizar sessao', async () => {
            const authData = buildAuthResponse({
                accessToken: 'new-access-token',
            });

            server.use(
                http.post(`*${API_URLS.AUTH_REFRESH}`, () =>
                    HttpResponse.json({ data: authData, success: true }),
                ),
            );

            const result = await refreshToken('refresh-token-456');

            expect(result.accessToken).toBe('new-access-token');
            expect(getStoredSession()?.accessToken).toBe('new-access-token');
        });
    });

    describe('getCurrentUser', () => {
        it('deve retornar null quando nao ha sessao armazenada', async () => {
            const result = await getCurrentUser();

            expect(result).toBeNull();
        });

        it('deve retornar dados do usuario quando sessao existe', async () => {
            const authData = buildAuthResponse();
            localStorage.setItem(
                'manga-reader:auth-user',
                JSON.stringify(authData),
            );

            server.use(
                http.get(`*${API_URLS.AUTH_ME}`, () =>
                    HttpResponse.json({ data: authData, success: true }),
                ),
            );

            const result = await getCurrentUser();

            expect(result?.userId).toBe('user-1');
        });

        it('deve retornar null quando API falha', async () => {
            const authData = buildAuthResponse();
            localStorage.setItem(
                'manga-reader:auth-user',
                JSON.stringify(authData),
            );

            server.use(
                http.get(`*${API_URLS.AUTH_ME}`, () =>
                    HttpResponse.json(null, { status: 401 }),
                ),
            );

            const result = await getCurrentUser();

            expect(result).toBeNull();
        });
    });

    describe('signOut', () => {
        it('deve limpar sessao do localStorage', async () => {
            localStorage.setItem(
                'manga-reader:auth-user',
                JSON.stringify(buildAuthResponse()),
            );

            await signOut();

            expect(getStoredSession()).toBeNull();
        });
    });

    describe('requestPasswordReset', () => {
        it('deve retornar mensagem de sucesso', async () => {
            server.use(
                http.post(`*${API_URLS.AUTH_FORGOT_PASSWORD}`, () =>
                    HttpResponse.json({
                        data: 'Email enviado',
                        success: true,
                    }),
                ),
            );

            const result = await requestPasswordReset('test@example.com');

            expect(result).toBe('Email enviado');
        });
    });

    describe('resetPassword', () => {
        it('deve retornar mensagem de sucesso', async () => {
            server.use(
                http.post(`*${API_URLS.AUTH_RESET_PASSWORD}`, () =>
                    HttpResponse.json({
                        data: 'Senha alterada',
                        success: true,
                    }),
                ),
            );

            const result = await resetPassword('token-123', 'newPass123');

            expect(result).toBe('Senha alterada');
        });
    });

    describe('getStoredSession', () => {
        it('deve retornar null quando localStorage esta vazio', () => {
            expect(getStoredSession()).toBeNull();
        });

        it('deve retornar sessao quando dados validos existem', () => {
            const authData = buildAuthResponse();
            localStorage.setItem(
                'manga-reader:auth-user',
                JSON.stringify(authData),
            );

            expect(getStoredSession()?.accessToken).toBe('access-token-123');
        });

        it('deve retornar null quando JSON e invalido', () => {
            localStorage.setItem('manga-reader:auth-user', '{invalid json');

            expect(getStoredSession()).toBeNull();
        });
    });

    describe('mapAuthResponseToUser', () => {
        it('deve mapear ADMIN para admin', () => {
            const user = mapAuthResponseToUser(
                buildAuthResponse({ role: 'ADMIN' }),
            );
            expect(user.role).toBe('admin');
        });

        it('deve mapear MODERATOR para poster', () => {
            const user = mapAuthResponseToUser(
                buildAuthResponse({ role: 'MODERATOR' }),
            );
            expect(user.role).toBe('poster');
        });

        it('deve mapear MEMBER para user', () => {
            const user = mapAuthResponseToUser(
                buildAuthResponse({ role: 'MEMBER' }),
            );
            expect(user.role).toBe('user');
        });

        it('deve usar user como fallback para role desconhecida', () => {
            const user = mapAuthResponseToUser(
                buildAuthResponse({ role: 'UNKNOWN' }),
            );
            expect(user.role).toBe('user');
        });

        it('deve usar string vazia quando photoUrl e undefined', () => {
            const user = mapAuthResponseToUser(
                buildAuthResponse({ photoUrl: undefined }),
            );
            expect(user.photo).toBe('');
        });
    });
});
