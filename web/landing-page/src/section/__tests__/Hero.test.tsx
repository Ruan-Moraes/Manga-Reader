import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Hero from '../Hero';
import { TestProviders } from '@/test/testUtils';

describe('Hero', () => {
    it('renders headline', () => {
        render(
            <TestProviders>
                <Hero />
            </TestProviders>,
        );

        expect(
            screen.getByText('Leia. Explore. Sem limites.'),
        ).toBeInTheDocument();
    });

    it('renders CTA buttons', () => {
        render(
            <TestProviders>
                <Hero />
            </TestProviders>,
        );

        expect(screen.getByText('Assinar Agora')).toBeInTheDocument();
    });

    it('renders stats badges after loading', async () => {
        render(
            <TestProviders>
                <Hero />
            </TestProviders>,
        );

        expect(await screen.findByText(/250/)).toBeInTheDocument();
        expect(await screen.findByText(/4\.820/)).toBeInTheDocument();
    });
});
