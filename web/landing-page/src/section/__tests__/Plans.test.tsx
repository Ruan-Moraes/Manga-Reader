import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { describe, expect, it } from 'vitest';

import Plans from '../Plans';

import { TestProviders } from '@/test/testUtils';
import { server } from '@/test/mocks/server';
import { errorHandlers } from '@/test/mocks/handlers/errorHandlers';

describe('Plans', () => {
    it('renders pricing cards after loading plans from MSW', async () => {
        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        await waitFor(() => {
            expect(screen.getByText('Mensal')).toBeInTheDocument();
            expect(screen.getByText('Diário')).toBeInTheDocument();
            expect(screen.getByText('Anual')).toBeInTheDocument();
        });
    });

    it('renders feature labels returned as strings by the public API', async () => {
        server.use(
            http.get('*/api/subscription-plans', () =>
                HttpResponse.json({
                    data: [
                        {
                            id: 'daily-real-contract',
                            period: 'DAILY',
                            priceInCents: 39,
                            description: 'Acesso por 1 dia.',
                            features: [
                                'Leitura ilimitada por 24h',
                                'Sem anúncios',
                            ],
                            active: true,
                        },
                    ],
                    success: true,
                    message: null,
                    statusCode: 200,
                }),
            ),
        );

        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        expect(
            await screen.findByText('Leitura ilimitada por 24h'),
        ).toBeInTheDocument();
        expect(screen.getByText('Sem anúncios')).toBeInTheDocument();
        expect(screen.getByText('Acesso por 1 dia.')).toBeInTheDocument();
    });

    it('shows the "Mais popular" ribbon on the monthly plan', async () => {
        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        await waitFor(() => {
            expect(screen.getByText('Mais popular')).toBeInTheDocument();
        });
    });

    it('shows skeleton loaders while loading', () => {
        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        const skeletons = document.querySelectorAll(
            '[data-testid="plan-skeleton"]',
        );

        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows a helpful status instead of invented prices when the API fails', async () => {
        server.use(errorHandlers.plans);

        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        expect(
            await screen.findByText('Planos temporariamente indisponíveis'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Estamos trabalhando para resolver isso o mais rápido possível. Tente novamente em alguns instantes.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText('Mensal')).not.toBeInTheDocument();
    });

    it('shows the unavailable status when the database has no active plans', async () => {
        server.use(
            http.get('*/api/subscription-plans', () =>
                HttpResponse.json({
                    data: [],
                    success: true,
                    message: null,
                    statusCode: 200,
                }),
            ),
        );

        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        expect(
            await screen.findByText('Planos temporariamente indisponíveis'),
        ).toBeInTheDocument();
        expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    });

    it('allows retrying the database-backed request', async () => {
        const user = userEvent.setup();
        let shouldFail = true;

        server.use(
            http.get('*/api/subscription-plans', () => {
                if (shouldFail) {
                    return HttpResponse.json(
                        {
                            data: null,
                            success: false,
                            message: 'Internal error',
                            statusCode: 500,
                        },
                        { status: 500 },
                    );
                }

                return HttpResponse.json({
                    data: [
                        {
                            id: 'monthly-after-retry',
                            period: 'MONTHLY',
                            priceInCents: 2490,
                            description: 'Plano recuperado do banco.',
                            features: ['Leitura ilimitada'],
                            active: true,
                        },
                    ],
                    success: true,
                    message: null,
                    statusCode: 200,
                });
            }),
        );

        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        await screen.findByText('Planos temporariamente indisponíveis');
        shouldFail = false;
        await user.click(
            screen.getByRole('button', { name: 'Tentar novamente' }),
        );

        expect(await screen.findByText('R$ 24,90')).toBeInTheDocument();
        expect(screen.getByText('Plano recuperado do banco.')).toBeInTheDocument();
    });
});
