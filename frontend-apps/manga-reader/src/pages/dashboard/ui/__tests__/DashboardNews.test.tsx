import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import DashboardNews from '../DashboardNews';

const mState = {
    news: [] as unknown[],
    page: 0,
    totalPages: 1,
    totalElements: 0,
    isLoading: false,
    search: '',
    setSearch: vi.fn(),
    setPage: vi.fn(),
};

vi.mock('@features/admin', () => ({
    useAdminNews: () => mState,
    useAdminNewsActions: () => ({ isSubmitting: false, handleDelete: vi.fn() }),
    AdminNewsList: ({ isLoading }: { isLoading: boolean }) => <div data-testid="news-list">{isLoading ? 'loading' : 'list'}</div>,
    ConfirmDeleteWithIdModal: () => null,
}));

describe('DashboardNews', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<DashboardNews />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    beforeEach(() => {
        mState.news = [];
        mState.isLoading = false;
        mState.totalElements = 0;
    });

    it('renders heading', () => {
        renderWithProviders(<DashboardNews />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has button to create news', () => {
        renderWithProviders(<DashboardNews />);
        // Navigation via button (not <Link>)
        const addBtns = screen.getAllByRole('button');
        expect(addBtns.some(b => /nova/i.test(b.textContent ?? ''))).toBe(true);
    });

    it('has search input', () => {
        renderWithProviders(<DashboardNews />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('passes loading state to AdminNewsList', () => {
        mState.isLoading = true;
        renderWithProviders(<DashboardNews />);
        expect(screen.getByText('loading')).toBeInTheDocument();
    });
});
