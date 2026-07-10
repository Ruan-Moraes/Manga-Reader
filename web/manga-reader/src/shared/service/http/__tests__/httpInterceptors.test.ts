import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { api } from '@shared/service/http';
import { AUTH_STORAGE_KEY, getAccessToken, setAccessToken, clearAccessToken, subscribeAuthExpired } from '@shared/service/session';

const RESOURCE_URL = '/api/protected-resource';

/** Recurso protegido: 401 para o token velho, 200 para o novo. */
const protectedResource = (validToken: string) =>
    http.get(`*${RESOURCE_URL}`, ({ request }) => {
        if (request.headers.get('Authorization') === `Bearer ${validToken}`) {
            return HttpResponse.json({ success: true, data: 'ok' });
        }

        return HttpResponse.json({ success: false, code: 'AUTH_TOKEN_EXPIRED', statusCode: 401 }, { status: 401 });
    });

describe('httpInterceptors — refresh automático com fila', () => {
    beforeEach(() => {
        localStorage.clear();
        clearAccessToken();
    });

    it('deve renovar no 401 e repetir a request original de forma transparente', async () => {
        setAccessToken('expired-token');

        server.use(
            protectedResource('new-access-token'),
            http.post(`*${API_URLS.AUTH_REFRESH}`, () =>
                HttpResponse.json({ success: true, data: { accessToken: 'new-access-token', refreshToken: null } }),
            ),
        );

        const response = await api.get(RESOURCE_URL);

        expect(response.data.data).toBe('ok');
        expect(getAccessToken()).toBe('new-access-token');
    });

    it('N requests concorrentes com 401 devem disparar UM único refresh', async () => {
        setAccessToken('expired-token');

        let refreshCalls = 0;

        server.use(
            protectedResource('new-access-token'),
            http.post(`*${API_URLS.AUTH_REFRESH}`, async () => {
                refreshCalls += 1;

                // Delay garante que os três 401 cheguem enquanto o refresh
                // está em andamento (exercita a fila de fato).
                await delay(80);

                return HttpResponse.json({ success: true, data: { accessToken: 'new-access-token', refreshToken: null } });
            }),
        );

        const results = await Promise.all([api.get(RESOURCE_URL), api.get(RESOURCE_URL), api.get(RESOURCE_URL)]);

        expect(results.map(r => r.data.data)).toEqual(['ok', 'ok', 'ok']);
        expect(refreshCalls).toBe(1);
    });

    it('refresh falho deve limpar sessão e notificar authExpired (logout limpo)', async () => {
        setAccessToken('expired-token');
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: 'u1', name: 'User', email: 'u@e.com', role: 'MEMBER' }));

        const onExpired = vi.fn();
        const unsubscribe = subscribeAuthExpired(onExpired);

        server.use(
            protectedResource('never-issued'),
            http.post(`*${API_URLS.AUTH_REFRESH}`, () =>
                HttpResponse.json({ success: false, code: 'AUTH_REFRESH_TOKEN_EXPIRED', statusCode: 401 }, { status: 401 }),
            ),
        );

        await expect(api.get(RESOURCE_URL)).rejects.toMatchObject({ statusCode: 401 });

        expect(onExpired).toHaveBeenCalledTimes(1);
        expect(getAccessToken()).toBeNull();
        expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

        unsubscribe();
    });

    it('401 em endpoint de auth (ex.: sign-in) não deve disparar refresh', async () => {
        let refreshCalls = 0;

        server.use(
            http.post(`*${API_URLS.AUTH_SIGN_IN}`, () =>
                HttpResponse.json({ success: false, code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401 }, { status: 401 }),
            ),
            http.post(`*${API_URLS.AUTH_REFRESH}`, () => {
                refreshCalls += 1;

                return HttpResponse.json({ success: true, data: { accessToken: 'x' } });
            }),
        );

        await expect(api.post(API_URLS.AUTH_SIGN_IN, { email: 'a@b.com', password: 'errada' })).rejects.toMatchObject({
            statusCode: 401,
        });

        expect(refreshCalls).toBe(0);
    });

    it('deve injetar o Bearer a partir da memória, não do localStorage', async () => {
        setAccessToken('memory-token');
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken: 'storage-token-antigo' }));

        let seenAuthorization: string | null = null;

        server.use(
            http.get(`*${RESOURCE_URL}`, ({ request }) => {
                seenAuthorization = request.headers.get('Authorization');

                return HttpResponse.json({ success: true, data: 'ok' });
            }),
        );

        await api.get(RESOURCE_URL);

        expect(seenAuthorization).toBe('Bearer memory-token');
    });
});
