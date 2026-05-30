import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';

import useDomainLabels from './useDomainLabels';
import { LABEL_TYPES } from '../type/label.types';

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;

describe('useDomainLabels', () => {
    it('deve retornar labels quando busca e bem-sucedida', async () => {
        server.use(
            http.get(`*${API_URLS.LABELS}`, () =>
                HttpResponse.json({
                    data: [
                        { value: 'ongoing', label: 'Em Publicação' },
                        { value: 'completed', label: 'Concluído' },
                    ],
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(() => useDomainLabels(LABEL_TYPES.PUBLICATION_STATUS), { wrapper });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data![0].label).toBe('Em Publicação');
    });

    it('deve retornar erro quando API falha', async () => {
        server.use(http.get(`*${API_URLS.LABELS}`, () => HttpResponse.json(null, { status: 500 })));

        const { result } = renderHook(() => useDomainLabels(LABEL_TYPES.PUBLICATION_STATUS), { wrapper });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });

    it('deve incluir o tipo na query key para cache isolado', async () => {
        server.use(http.get(`*${API_URLS.LABELS}`, () => HttpResponse.json({ data: [], success: true })));

        const { result: resultStatus } = renderHook(() => useDomainLabels(LABEL_TYPES.PUBLICATION_STATUS), { wrapper });
        const { result: resultCategory } = renderHook(() => useDomainLabels(LABEL_TYPES.NEWS_CATEGORY), { wrapper });

        await waitFor(() => {
            expect(resultStatus.current.isSuccess).toBe(true);
            expect(resultCategory.current.isSuccess).toBe(true);
        });
    });
});
