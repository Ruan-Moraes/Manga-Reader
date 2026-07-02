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

        expect(screen.getByText(/Leia mangás/)).toBeInTheDocument();
    });

    it('renders CTA buttons', () => {
        render(
            <TestProviders>
                <Hero />
            </TestProviders>,
        );

        expect(screen.getByText('Começar agora')).toBeInTheDocument();
        expect(screen.getByText('Ver demonstração')).toBeInTheDocument();
    });

    it('renders platform badges', () => {
        render(
            <TestProviders>
                <Hero />
            </TestProviders>,
        );

        expect(screen.getByText('Offline')).toBeInTheDocument();
        expect(screen.getByText('Sem anúncios')).toBeInTheDocument();
    });
});
