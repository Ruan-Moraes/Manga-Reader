import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import Dmca from '../Dmca';

describe('Dmca', () => {
    it('renders page title', () => {
        renderWithProviders(<Dmca />);
        expect(screen.getByRole('heading', { name: /dmca/i, level: 1 })).toBeInTheDocument();
    });

    it('DMCA tab is active', () => {
        renderWithProviders(<Dmca />);
        expect(screen.getByRole('button', { name: /dmca/i })).toHaveAttribute('aria-current', 'page');
    });

    it('renders section headings', () => {
        renderWithProviders(<Dmca />);
        expect(screen.getAllByRole('heading', { name: /quem pode pedir remoção/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('heading', { name: /como pedir remoção/i }).length).toBeGreaterThan(0);
    });

    it('renders agent contact info', () => {
        renderWithProviders(<Dmca />);
        expect(screen.getAllByText(/dmca@manga-reader\.example\.com/i).length).toBeGreaterThan(0);
    });

    it('renders warning aside', () => {
        renderWithProviders(<Dmca />);
        expect(screen.getByText(/declarações falsas/i)).toBeInTheDocument();
    });

    it('renders priority CTA card', () => {
        renderWithProviders(<Dmca />);
        expect(screen.getByRole('button', { name: /canal prioritário/i })).toBeInTheDocument();
    });

    it('renders cross-links to other docs', () => {
        renderWithProviders(<Dmca />);
        expect(screen.getByRole('navigation', { name: /outros documentos/i })).toBeInTheDocument();
    });
});
