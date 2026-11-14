import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import DashboardEvents from '../DashboardEvents';

const mState = {
    events: [] as unknown[],
    page: 0,
    totalPages: 1,
    totalElements: 0,
    isLoading: false,
    search: '',
    setSearch: vi.fn(),
    setPage: vi.fn(),
};

vi.mock('@features/admin', () => ({
    useAdminEvents: () => mState,
    useAdminEventActions: () => ({
        isSubmitting: false,
        handleCreate: vi.fn(),
        handleUpdate: vi.fn(),
        handleDelete: vi.fn(),
    }),
    AdminEventList: ({ isLoading }: { isLoading: boolean }) => <div data-testid="event-list">{isLoading ? 'loading' : 'list'}</div>,
    EventFormModal: () => null,
    ConfirmDeleteWithIdModal: () => null,
}));

describe('DashboardEvents', () => {
    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<DashboardEvents />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    beforeEach(() => {
        mState.events = [];
        mState.isLoading = false;
        mState.totalElements = 0;
    });

    it('renders heading', () => {
        renderWithProviders(<DashboardEvents />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has button to create event', () => {
        renderWithProviders(<DashboardEvents />);
        const btns = screen.getAllByRole('button');
        expect(btns.some(b => /novo/i.test(b.textContent ?? ''))).toBe(true);
    });

    it('has search input', () => {
        renderWithProviders(<DashboardEvents />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('passes loading state to AdminEventList', () => {
        mState.isLoading = true;
        renderWithProviders(<DashboardEvents />);
        expect(screen.getByText('loading')).toBeInTheDocument();
    });
});
