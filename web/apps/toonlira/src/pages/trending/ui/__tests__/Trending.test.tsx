import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';

const trendItem = {
        id: 'title-1', name: 'Berserk', type: 'Manga', genres: ['Seinen'], score: 120,
        growthPercent: 34, calculatedAt: '2026-07-10T03:15:00',
        metrics: { reads: 120, libraryAdds: 20, reviews: 4, comments: 8, releases: 1 },
        growth: { reads: 42, libraryAdds: 30, reviews: 18, comments: 12, releases: 0 },
};

const { useTrendingDashboardMock } = vi.hoisted(() => ({ useTrendingDashboardMock: vi.fn() }));

vi.mock('@entities/trend', () => ({ useTrendingDashboard: useTrendingDashboardMock }));

import Trending from '../Trending';

describe('Trending', () => {
    beforeEach(() => {
        useTrendingDashboardMock.mockReturnValue({ data: {
            momentum: [trendItem], mostRead: [trendItem], mostReviewed: [trendItem], mostSaved: [trendItem],
        }, isLoading: false, isError: false });
    });

    it('has no axe violations', async () => {
        const { container } = renderWithProviders(<Trending />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('renders calculated ranking and available windows', () => {
        renderWithProviders(<Trending />);
        expect(screen.getAllByText('Berserk')).toHaveLength(4);
        expect(screen.getByRole('radio', { name: 'Hoje' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Semana' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'Mês' })).toBeInTheDocument();
        expect(screen.getByText('Mais lidas')).toBeInTheDocument();
        expect(screen.getByText('Mais avaliadas')).toBeInTheDocument();
        expect(screen.getByText('Mais salvas')).toBeInTheDocument();
        expect(screen.getAllByText('+34%')).toHaveLength(1);
    });

    it('renders loading state accessibly', () => {
        useTrendingDashboardMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

        renderWithProviders(<Trending />);

        expect(screen.getByLabelText('Carregando tendências')).toBeInTheDocument();
    });

    it('renders API failure state', () => {
        useTrendingDashboardMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });

        renderWithProviders(<Trending />);

        expect(screen.getByText('Não foi possível carregar as tendências agora.')).toBeInTheDocument();
    });
});
