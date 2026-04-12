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

    it('shows "Mais Popular" badge on monthly plan', async () => {
        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        await waitFor(() => {
            expect(screen.getByText('Mais Popular')).toBeInTheDocument();
        });
    });

    it('shows skeleton loaders while loading', () => {
        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        const skeletons = document.querySelectorAll('.animate-pulse');

        expect(skeletons.length).toBe(3);
    });

    it('shows error message when API fails', async () => {
        server.use(errorHandlers.plans);

        render(
            <TestProviders>
                <Plans />
            </TestProviders>,
        );

        expect(
            await screen.findByText(/Não foi possível carregar os planos/),
        ).toBeInTheDocument();
    });
});
