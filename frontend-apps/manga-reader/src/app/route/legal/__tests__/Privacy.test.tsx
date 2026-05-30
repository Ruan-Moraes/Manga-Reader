import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import Privacy from '../Privacy';

describe('Privacy', () => {
    it('renders page title', () => {
        renderWithProviders(<Privacy />);
        expect(
            screen.getByRole('heading', {
                name: /política de privacidade/i,
                level: 1,
            }),
        ).toBeInTheDocument();
    });

    it('renders all 4 legal doc tabs', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getByRole('button', { name: /termos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /privacidade/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /dmca/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /contato/i })).toBeInTheDocument();
    });

    it('Privacidade tab is active', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getByRole('button', { name: /privacidade/i })).toHaveAttribute('aria-current', 'page');
    });

    it('renders section headings', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getAllByRole('heading', { name: /quais dados coletamos/i }).length).toBeGreaterThan(0);
    });

    it('renders cross-links to other docs', () => {
        renderWithProviders(<Privacy />);
        expect(screen.getByRole('navigation', { name: /outros documentos/i })).toBeInTheDocument();
    });
});
