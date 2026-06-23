import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import Terms from '../Terms';

describe('Terms', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<Terms />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders page title', () => {
        renderWithProviders(<Terms />);
        expect(screen.getByRole('heading', { name: /termos de uso/i, level: 1 })).toBeInTheDocument();
    });

    it('renders all 4 legal doc tabs', () => {
        renderWithProviders(<Terms />);
        // Exact name to avoid matching TOC item "Mudanças nestes termos"
        expect(screen.getByRole('button', { name: 'Termos' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Privacidade' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'DMCA' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Contato' })).toBeInTheDocument();
    });

    it('Termos tab is active (aria-current=page)', () => {
        renderWithProviders(<Terms />);
        expect(screen.getByRole('button', { name: 'Termos' })).toHaveAttribute('aria-current', 'page');
    });

    it('renders TOC items', () => {
        renderWithProviders(<Terms />);
        expect(screen.getAllByText(/aceite e quem somos/i).length).toBeGreaterThan(0);
    });

    it('renders section headings', () => {
        renderWithProviders(<Terms />);
        expect(screen.getAllByRole('heading', { name: /sua conta/i }).length).toBeGreaterThan(0);
        expect(screen.getAllByRole('heading', { name: /uso do serviço/i }).length).toBeGreaterThan(0);
    });

    it('renders version and date badges', () => {
        renderWithProviders(<Terms />);
        expect(screen.getByText(/v1\.0/i)).toBeInTheDocument();
        expect(screen.getByText(/01\/01\/2025/i)).toBeInTheDocument();
    });

    it('renders cross-links nav', () => {
        renderWithProviders(<Terms />);
        // LegalCrossLinks renders nav with "Outros documentos"
        expect(screen.getByRole('navigation', { name: /documentos legais/i })).toBeInTheDocument();
    });

    it('renders CTA card', () => {
        renderWithProviders(<Terms />);
        expect(screen.getByRole('button', { name: /falar com o time/i })).toBeInTheDocument();
    });
});
