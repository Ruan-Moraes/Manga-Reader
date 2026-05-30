import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import NewReleases from '../NewReleases';

describe('NewReleases', () => {
    it('renders main landmark', () => {
        renderWithProviders(<NewReleases />);
        expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders section heading', () => {
        renderWithProviders(<NewReleases />);
        expect(screen.getByRole('heading', { name: /lançamentos recentes/i })).toBeInTheDocument();
    });

    it('renders search field', () => {
        renderWithProviders(<NewReleases />);
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders language select', () => {
        renderWithProviders(<NewReleases />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders library-only switch', () => {
        renderWithProviders(<NewReleases />);
        expect(screen.getByRole('switch', { name: /só minha biblioteca/i })).toBeInTheDocument();
    });

    it('renders release group headings', () => {
        renderWithProviders(<NewReleases />);
        expect(screen.getByText(/hoje/i)).toBeInTheDocument();
    });

    it('renders manga titles in releases', () => {
        renderWithProviders(<NewReleases />);
        expect(screen.getAllByText(/berserk/i).length).toBeGreaterThan(0);
    });

    it('filters by search query', async () => {
        const user = userEvent.setup();
        renderWithProviders(<NewReleases />);
        const search = screen.getByRole('searchbox');
        await user.type(search, 'Berserk');
        expect(screen.getAllByText(/berserk/i).length).toBeGreaterThan(0);
        expect(screen.queryByText('One Piece')).not.toBeInTheDocument();
    });

    it('library-only switch toggles state', async () => {
        const user = userEvent.setup();
        renderWithProviders(<NewReleases />);
        const sw = screen.getByRole('switch', { name: /só minha biblioteca/i });
        expect(sw).toHaveAttribute('aria-checked', 'false');
        await user.click(sw);
        expect(sw).toHaveAttribute('aria-checked', 'true');
    });
});
