import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import News from '../News';
import type { NewsSummary } from '@entities/news';

const update = vi.fn();
const state = {
    page: 0, q: '', category: '', period: 'all' as const, sort: 'recent' as const,
    categories: [{ value: 'LANCAMENTOS', label: 'Lançamentos' }, { value: 'EVENTOS', label: 'Eventos' }],
    items: [] as NewsSummary[], hero: undefined as NewsSummary | undefined, feed: [] as NewsSummary[], totalPages: 0, totalElements: 0,
    isLoading: false, isFetching: false, isError: false, refetch: vi.fn(), update,
};

vi.mock('../../model/useNewsPage', () => ({ useNewsPage: () => state }));

describe('News', () => {
    beforeEach(() => { update.mockClear(); state.isLoading = false; state.isError = false; state.items = []; state.feed = []; state.hero = undefined; });

    it('renders editorial header and filters', () => {
        renderWithProviders(<News />);
        expect(screen.getByRole('heading', { level: 1, name: 'Notícias' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Lançamentos' })).toBeInTheDocument();
    });

    it('persists selected category through page model', async () => {
        renderWithProviders(<News />);
        await userEvent.click(screen.getByRole('button', { name: 'Lançamentos' }));
        expect(update).toHaveBeenCalledWith({ category: 'LANCAMENTOS' });
    });

    it('renders skeleton while loading', () => {
        state.isLoading = true;
        renderWithProviders(<News />);
        expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
});
