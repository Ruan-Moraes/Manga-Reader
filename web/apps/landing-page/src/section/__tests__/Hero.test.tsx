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

    it('renders the conversion, platform access and demo actions', () => {
        render(
            <TestProviders>
                <Hero />
            </TestProviders>,
        );

        expect(
            screen.getByRole('button', { name: 'Começar agora' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Acessar plataforma' }),
        ).toHaveAttribute('href', 'http://localhost:5173/');
        const demo = screen.getByRole('button', { name: 'Ver demonstração' });
        expect(demo).toHaveClass(
            'border-accent-border/60',
            'min-h-[54px]',
        );
        expect(
            demo.querySelector('span[aria-hidden="true"]'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Começar agora' }).parentElement,
        ).toHaveClass('lg:grid', 'lg:grid-cols-2');
    });

    it('anchors status badges inside the product preview without covering the phone', () => {
        const { container } = render(
            <TestProviders>
                <Hero />
            </TestProviders>,
        );

        expect(screen.getByText('Capítulo novo')).toHaveClass(
            'hidden',
            'md:inline-flex',
        );
        expect(screen.getAllByText('Continuar lendo')).toHaveLength(2);
        expect(screen.getByText('Sincronizado')).toHaveClass(
            'hidden',
            'lg:inline-flex',
        );
        expect(container.querySelectorAll('[role="img"]')).toHaveLength(2);
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
