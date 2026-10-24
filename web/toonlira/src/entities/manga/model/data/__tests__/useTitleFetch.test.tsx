import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import { buildTitle } from '@/test/factories/titleFactory';

import useTitleFetch from '../useTitleFetch';

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;

describe('useTitleFetch', () => {
    it('deve retornar titulo quando busca e bem-sucedida', async () => {
        const titulo = buildTitle({ id: '1', name: 'One Piece' });

        server.use(http.get(`*${API_URLS.TITLES}/1`, () => HttpResponse.json({ data: titulo, success: true })));

        const { result } = renderHook(() => useTitleFetch('1'), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(titulo);
    });

    // Regressão do bug de reload: IDs de título são strings do MongoDB (ObjectId),
    // não numéricos. A query deve carregá-los sem rejeitar por Number()/NaN.
    it('deve retornar titulo para id string (ObjectId Mongo) no reload', async () => {
        const objectId = '507f1f77bcf86cd799439011';
        const titulo = buildTitle({ id: objectId, name: 'Berserk' });

        server.use(http.get(`*${API_URLS.TITLES}/${objectId}`, () => HttpResponse.json({ data: titulo, success: true })));

        const { result } = renderHook(() => useTitleFetch(objectId), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(titulo);
    });

    it('nao dispara fetch quando id e vazio (enabled: false)', async () => {
        const { result } = renderHook(() => useTitleFetch(''), { wrapper });

        await waitFor(() => {
            expect(result.current.fetchStatus).toBe('idle');
        });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isError).toBe(false);
    });

    it('deve retornar erro quando API falha', async () => {
        server.use(http.get(`*${API_URLS.TITLES}/999`, () => HttpResponse.json(null, { status: 404 })));

        const { result } = renderHook(() => useTitleFetch('999'), { wrapper });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });
});
