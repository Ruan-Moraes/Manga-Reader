import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import DashboardUsers from '../DashboardUsers';

const mState = {
    users: [] as unknown[],
    page: 0,
    totalPages: 1,
    totalElements: 0,
    isLoading: false,
    search: '',
    setSearch: vi.fn(),
    setPage: vi.fn(),
};

vi.mock('@features/admin', () => ({
    useAdminUsers: () => mState,
    useAdminUserActions: () => ({ isSubmitting: false, handleDelete: vi.fn() }),
    AdminUserList: ({ isLoading }: { isLoading: boolean }) => <div data-testid="user-list">{isLoading ? 'loading' : 'list'}</div>,
    ConfirmDeleteWithIdModal: () => null,
}));

describe('DashboardUsers', () => {
    beforeEach(() => {
        mState.users = [];
        mState.isLoading = false;
        mState.totalElements = 0;
    });

    it('renders heading', () => {
        renderWithProviders(<DashboardUsers />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has search input', () => {
        renderWithProviders(<DashboardUsers />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('has search submit button', () => {
        renderWithProviders(<DashboardUsers />);
        const btns = screen.getAllByRole('button');
        expect(btns.some(b => /buscar|search/i.test(b.textContent ?? ''))).toBe(true);
    });

    it('passes loading state to AdminUserList', () => {
        mState.isLoading = true;
        renderWithProviders(<DashboardUsers />);
        expect(screen.getByText('loading')).toBeInTheDocument();
    });
});
