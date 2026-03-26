import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import useAuth from './useAuth';

const buildAuthResponse = (overrides = {}) => ({
    accessToken: 'access-123',
    refreshToken: 'refresh-456',
    userId: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'MEMBER',
    photoUrl: 'photo.jpg',
    ...overrides,
});

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('deve iniciar com user null quando sem sessao', async () => {
        const { result } = renderHook(() => useAuth());

        // aguardar useEffect
        await waitFor(() => {
            expect(result.current.user).toBeNull();
        });

        expect(result.current.isLoggedIn).toBe(false);
    });

    it('deve restaurar usuario quando sessao existe no localStorage', async () => {
        const authData = buildAuthResponse();
        localStorage.setItem('manga-reader:auth-user', JSON.stringify(authData));

        server.use(
            http.get(`*${API_URLS.AUTH_ME}`, () =>
                HttpResponse.json({ data: authData, success: true }),
            ),
        );

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.user).not.toBeNull();
        });

        expect(result.current.user?.name).toBe('Test User');
        expect(result.current.isLoggedIn).toBe(true);
    });

    it('deve fazer login e atualizar user', async () => {
        const authData = buildAuthResponse();

        server.use(
            http.post(`*${API_URLS.AUTH_SIGN_IN}`, () =>
                HttpResponse.json({ data: authData, success: true }),
            ),
        );

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            const user = await result.current.login({
                email: 'test@example.com',
                password: '123456',
            });
            expect(user.name).toBe('Test User');
        });

        expect(result.current.user?.name).toBe('Test User');
        expect(result.current.isLoggedIn).toBe(true);
    });

    it('deve fazer registro e atualizar user', async () => {
        const authData = buildAuthResponse({ name: 'New User' });

        server.use(
            http.post(`*${API_URLS.AUTH_SIGN_UP}`, () =>
                HttpResponse.json({ data: authData, success: true }),
            ),
        );

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            await result.current.register({
                name: 'New User',
                email: 'new@example.com',
                password: '123456',
            });
        });

        expect(result.current.user?.name).toBe('New User');
    });

    it('deve fazer logout e limpar user', async () => {
        const authData = buildAuthResponse();
        localStorage.setItem('manga-reader:auth-user', JSON.stringify(authData));

        server.use(
            http.get(`*${API_URLS.AUTH_ME}`, () =>
                HttpResponse.json({ data: authData, success: true }),
            ),
        );

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.user).not.toBeNull();
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isLoggedIn).toBe(false);
    });
});
