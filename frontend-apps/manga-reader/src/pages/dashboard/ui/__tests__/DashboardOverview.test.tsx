import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import DashboardOverview from '../DashboardOverview';

const mockMetrics = {
    totalUsers: 1200,
    activeUsers: 340,
    newUsersToday: 12,
    totalTitles: 80,
};
const mockContent = {
    totalChapters: 5000,
    chaptersToday: 20,
    pendingReview: 3,
    totalComments: 8900,
};

// Mutable state objects — mutate in beforeEach/tests, never reassign
const mState = {
    metrics: null as typeof mockMetrics | null,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
};
const cState = {
    metrics: null as typeof mockContent | null,
    isLoading: false,
    isError: false,
};

vi.mock('@features/admin', () => ({
    useDashboardMetrics: () => mState,
    useContentMetrics: () => cState,
    AdminDashboardOverview: ({ metrics }: { metrics: unknown }) => <div data-testid="admin-overview">{String(metrics)}</div>,
    ContentMetricsPanel: ({ metrics }: { metrics: unknown }) => <div data-testid="content-metrics">{String(metrics)}</div>,
}));

describe('DashboardOverview', () => {
    beforeEach(() => {
        mState.metrics = null;
        mState.isLoading = true;
        mState.isError = false;
        cState.metrics = null;
        cState.isLoading = false;
        cState.isError = false;
    });

    it('renders no heading while loading', () => {
        renderWithProviders(<DashboardOverview />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('shows retry button on error', () => {
        mState.isLoading = false;
        mState.isError = true;
        renderWithProviders(<DashboardOverview />);
        expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
    });

    it('renders heading and panels on success', () => {
        mState.metrics = mockMetrics;
        mState.isLoading = false;
        cState.metrics = mockContent;
        renderWithProviders(<DashboardOverview />);
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByTestId('admin-overview')).toBeInTheDocument();
        expect(screen.getByTestId('content-metrics')).toBeInTheDocument();
    });
});
