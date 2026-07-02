import { render, screen, waitFor } from '@testing-library/react';

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

        const skeletons = document.querySelectorAll('.lp-skeleton');

        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('falls back to static plans when the API fails', async () => {
        server.use(errorHandlers.plans);

        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        // sem erro cru: cai no conteúdo estático do i18n
        expect(await screen.findByText('Mensal')).toBeInTheDocument();
    });
});
