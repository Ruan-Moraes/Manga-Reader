import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import DashboardGroups from '../DashboardGroups';

const mState = {
    groups: [] as unknown[],
    page: 0,
    totalPages: 1,
    totalElements: 0,
    isLoading: false,
    search: '',
    setSearch: vi.fn(),
    setPage: vi.fn(),
};

vi.mock('@features/admin', () => ({
    useAdminGroups: () => mState,
    useAdminGroupActions: () => ({
        isSubmitting: false,
        handleDelete: vi.fn(),
    }),
    AdminGroupList: ({ isLoading }: { isLoading: boolean }) => <div data-testid="group-list">{isLoading ? 'loading' : 'list'}</div>,
    ConfirmDeleteWithIdModal: () => null,
}));

describe('DashboardGroups', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<DashboardGroups />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    beforeEach(() => {
        mState.groups = [];
        mState.isLoading = false;
        mState.totalElements = 0;
    });

    it('renders heading', () => {
        renderWithProviders(<DashboardGroups />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has search input', () => {
        renderWithProviders(<DashboardGroups />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('has search submit button', () => {
        renderWithProviders(<DashboardGroups />);
        const btns = screen.getAllByRole('button');
        expect(btns.some(b => /buscar|search/i.test(b.textContent ?? ''))).toBe(true);
    });

    it('passes loading state to AdminGroupList', () => {
        mState.isLoading = true;
        renderWithProviders(<DashboardGroups />);
        expect(screen.getByText('loading')).toBeInTheDocument();
    });
});
