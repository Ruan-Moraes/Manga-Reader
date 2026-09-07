import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import useFollow from '../useFollow';

// Sessão autenticada — requireAuth lê a sessão armazenada.
vi.mock('@shared/service/session', async importOriginal => ({
    ...(await importOriginal<typeof import('@shared/service/session')>()),
    getStoredSession: () => ({ userId: 'u1' }),
    getAccessToken: () => 'token',
}));

const wrap = <T,>(data: T) => ({ data, success: true });

describe('useFollow (DT-48)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('segue com atualização otimista e reconcilia com o servidor', async () => {
        server.use(http.post(`*${API_URLS.USERS}/u1/follow`, () => HttpResponse.json(wrap({ following: true, followersCount: 10 }))));

        const { result } = renderHook(() => useFollow('u1', { following: false, followersCount: 3 }));

        act(() => {
            void result.current.toggle();
        });

        // Otimista: alterna na hora
        expect(result.current.following).toBe(true);
        expect(result.current.followersCount).toBe(4);

        // Reconciliação com a contagem real do servidor
        await waitFor(() => expect(result.current.followersCount).toBe(10));
        expect(result.current.following).toBe(true);
    });

    it('deixa de seguir e reconcilia', async () => {
        server.use(http.delete(`*${API_URLS.USERS}/u1/follow`, () => HttpResponse.json(wrap({ following: false, followersCount: 2 }))));

        const { result } = renderHook(() => useFollow('u1', { following: true, followersCount: 3 }));

        act(() => {
            void result.current.toggle();
        });

        expect(result.current.following).toBe(false);

        await waitFor(() => expect(result.current.followersCount).toBe(2));
    });

    it('faz rollback no erro do servidor', async () => {
        server.use(http.post(`*${API_URLS.USERS}/u1/follow`, () => new HttpResponse(null, { status: 500 })));

        const { result } = renderHook(() => useFollow('u1', { following: false, followersCount: 3 }));

        act(() => {
            void result.current.toggle();
        });

        expect(result.current.following).toBe(true);

        // Rollback ao estado anterior
        await waitFor(() => expect(result.current.following).toBe(false));
        expect(result.current.followersCount).toBe(3);
    });

    it('re-sincroniza quando o perfil recarrega com outra base', async () => {
        const { result, rerender } = renderHook(({ initial }) => useFollow('u1', initial), {
            initialProps: { initial: { following: false, followersCount: 0 } },
        });

        rerender({ initial: { following: true, followersCount: 7 } });

        await waitFor(() => expect(result.current.followersCount).toBe(7));
        expect(result.current.following).toBe(true);
    });
});
