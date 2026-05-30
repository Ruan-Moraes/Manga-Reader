import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import Trending from '../Trending';

describe('Trending', () => {
    it('renders main landmark', () => {
        renderWithProviders(<Trending />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders section heading', () => {
        renderWithProviders(<Trending />);
        expect(screen.getByRole('heading', { name: /em alta na comunidade/i })).toBeInTheDocument();
    });

    it('renders period filter controls', () => {
        renderWithProviders(<Trending />);
        expect(screen.getByRole('radio', { name: /hoje/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /semana/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /mês/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /sempre/i })).toBeInTheDocument();
    });

    it('renders category select', () => {
        renderWithProviders(<Trending />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders manga titles in list', () => {
        renderWithProviders(<Trending />);
        expect(screen.getAllByText(/berserk/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/one piece/i).length).toBeGreaterThan(0);
    });

    it('changes period filter on click', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Trending />);
        const hoje = screen.getByRole('radio', { name: /hoje/i });
        await user.click(hoje);
        expect(hoje).toHaveAttribute('aria-checked', 'true');
    });
});
