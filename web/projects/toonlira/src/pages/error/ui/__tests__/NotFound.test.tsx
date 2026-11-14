import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import NotFound from '../NotFound';

describe('NotFound', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<NotFound />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders 404 title', () => {
        renderWithProviders(<NotFound />);
        expect(screen.getByText(/página não encontrada/i)).toBeInTheDocument();
    });

    it('renders description', () => {
        renderWithProviders(<NotFound />);
        expect(screen.getByText(/endereço que você acessou não existe/i)).toBeInTheDocument();
    });

    it('renders home navigation button', () => {
        renderWithProviders(<NotFound />);
        expect(screen.getByRole('button', { name: /ir para o início/i })).toBeInTheDocument();
    });

    it('renders search button', () => {
        renderWithProviders(<NotFound />);
        expect(screen.getByRole('button', { name: /buscar obras/i })).toBeInTheDocument();
    });

    it('renders as main landmark', () => {
        renderWithProviders(<NotFound />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });
});
