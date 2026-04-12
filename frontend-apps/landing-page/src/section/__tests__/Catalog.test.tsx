import { render, screen, waitFor } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import Catalog from '../Catalog';

import { TestProviders } from '@/test/testUtils';
import { server } from '@/test/mocks/server';
import { errorHandlers } from '@/test/mocks/handlers/errorHandlers';

describe('Catalog', () => {
    it('renders stats from MSW after loading', async () => {
        render(
            <TestProviders>
                <Catalog />
            </TestProviders>,
        );

        await waitFor(() => {
            expect(screen.getByText('Obras disponíveis')).toBeInTheDocument();
            expect(screen.getByText('Capítulos para ler')).toBeInTheDocument();
        });
    });

    it('shows skeleton loader while loading', () => {
        render(
            <TestProviders>
                <Catalog />
            </TestProviders>,
        );

        const skeletons = document.querySelectorAll('[class*="animate-pulse"]');

        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows error message when API fails', async () => {
        server.use(errorHandlers.stats);

        render(
            <TestProviders>
                <Catalog />
            </TestProviders>,
        );

        expect(
            await screen.findByText(
                /Não foi possível carregar/i,
                {},
                { timeout: 3000 },
            ),
        ).toBeInTheDocument();
    });
});
