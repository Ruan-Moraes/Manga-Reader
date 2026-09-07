import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { usePlans } from '../usePlans';
import { renderHookWithProviders } from '@/test/testUtils';
import { server } from '@/test/mocks/server';

describe('usePlans', () => {
    it('fetches subscription plans from MSW', async () => {
        const { result } = renderHookWithProviders(() => usePlans());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
        expect(result.current.data!.length).toBe(3);
    });

    it('returns plans with correct period types', async () => {
        const { result } = renderHookWithProviders(() => usePlans());

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const periods = result.current.data!.map(p => p.period);

        expect(periods).toContain('DAILY');
        expect(periods).toContain('MONTHLY');
        expect(periods).toContain('ANNUAL');
    });

    it('requests localized plan content and isolates the locale in cache', async () => {
        let acceptLanguage: string | null = null;

        server.use(
            http.get('*/api/subscription-plans', ({ request }) => {
                acceptLanguage = request.headers.get('Accept-Language');

                return HttpResponse.json({
                    data: [],
                    success: true,
                    message: null,
                    statusCode: 200,
                });
            }),
        );

        const { result } = renderHookWithProviders(() => usePlans('es-ES'));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(acceptLanguage).toBe('es-ES');
    });

    it('rejects a successful HTTP response with an invalid plans payload', async () => {
        server.use(
            http.get('*/api/subscription-plans', () =>
                HttpResponse.json({
                    data: null,
                    success: true,
                    message: null,
                    statusCode: 200,
                }),
            ),
        );

        const { result } = renderHookWithProviders(() => usePlans('pt-BR'));

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toBeUndefined();
    });
});
