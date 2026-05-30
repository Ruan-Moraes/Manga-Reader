import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import DashboardTags from '../DashboardTags';

const mState = {
    tags: [] as unknown[],
    page: 0,
    totalPages: 1,
    totalElements: 0,
    isLoading: false,
    search: '',
    setSearch: vi.fn(),
    setPage: vi.fn(),
};

vi.mock('@feature/admin', () => ({
    useAdminTags: () => mState,
    useAdminTagActions: () => ({
        isSubmitting: false,
        handleCreate: vi.fn(),
        handleUpdate: vi.fn(),
        handleDelete: vi.fn(),
    }),
    AdminTagList: ({ isLoading }: { isLoading: boolean }) => <div data-testid="tag-list">{isLoading ? 'loading' : 'list'}</div>,
    TagFormModal: () => null,
    ConfirmDeleteWithIdModal: () => null,
}));

describe('DashboardTags', () => {
    beforeEach(() => {
        mState.tags = [];
        mState.isLoading = false;
        mState.totalElements = 0;
    });

    it('renders heading', () => {
        renderWithProviders(<DashboardTags />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has search input', () => {
        renderWithProviders(<DashboardTags />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('has button to create tag', () => {
        renderWithProviders(<DashboardTags />);
        const btns = screen.getAllByRole('button');
        expect(btns.some(b => /nova|new/i.test(b.textContent ?? ''))).toBe(true);
    });

    it('passes loading state to AdminTagList', () => {
        mState.isLoading = true;
        renderWithProviders(<DashboardTags />);
        expect(screen.getByText('loading')).toBeInTheDocument();
    });
});
