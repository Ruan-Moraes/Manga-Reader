import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MangaRating, RatingDistribution } from '@entities/rating';
import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import ReviewsTab from '../parts/ReviewsTab';

vi.mock('@features/auth', () => ({
    useAuth: () => ({ isLoggedIn: false, user: null }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    AUTH_KEY: 'auth',
}));

const average = { average: 4.9, count: 14820 };
const distribution: RatingDistribution = { star1: 2, star2: 3, star3: 5, star4: 20, star5: 70, total: 100 };

const buildRating = (overrides: Partial<MangaRating> = {}): MangaRating => ({
    id: 'r1',
    titleId: 't1',
    userName: 'Guts',
    overallRating: 4.8,
    funRating: 5,
    artRating: 5,
    storylineRating: 5,
    charactersRating: 5,
    originalityRating: 4,
    pacingRating: 4,
    comment: 'Obra-prima absoluta.',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

const page = (content: MangaRating[]) => ({
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    last: true,
});

/** Registra o handler de listagem de resenhas (server-side, DT-47). */
const mockReviews = (content: MangaRating[]) =>
    server.use(http.get(`*${API_URLS.RATINGS}/title/t1`, () => HttpResponse.json({ data: page(content), success: true })));

const renderTab = (props: Partial<Parameters<typeof ReviewsTab>[0]> = {}) =>
    renderWithProviders(<ReviewsTab titleId="t1" average={average} distribution={distribution} onWriteReview={() => {}} {...props} />);

describe('ReviewsTab', () => {
    it('renders login prompt when logged out', () => {
        mockReviews([]);
        renderTab();
        expect(screen.getByText(/entre para avaliar/i)).toBeInTheDocument();
    });

    it('shows empty-state message when no reviews exist', async () => {
        mockReviews([]);
        renderTab();
        expect(await screen.findByText(/ainda sem resenhas/i)).toBeInTheDocument();
    });

    it('renders the rating summary section', () => {
        mockReviews([]);
        renderTab();
        expect(screen.getByRole('region', { name: /avaliação geral/i })).toBeInTheDocument();
    });

    it('renders a review comment fetched from the API', async () => {
        mockReviews([buildRating()]);
        renderTab();
        expect(await screen.findByText('Obra-prima absoluta.')).toBeInTheDocument();
    });

    it('renders the real rating distribution as percentages', () => {
        mockReviews([]);
        renderTab();
        expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('20%').length).toBeGreaterThanOrEqual(1);
    });

    it('clicking a star-row shows the clear filter button', async () => {
        mockReviews([buildRating()]);
        const user = userEvent.setup();
        renderTab();
        await user.click(screen.getByTitle(/filtrar por 5 estrelas/i));
        expect(await screen.findByText(/limpar filtro/i)).toBeInTheDocument();
    });

    it('"Entrar" navigates (does not call onWriteReview)', async () => {
        mockReviews([]);
        const onWriteReview = vi.fn();
        const user = userEvent.setup();
        renderTab({ onWriteReview });
        await user.click(screen.getByRole('button', { name: /^entrar$/i }));
        expect(onWriteReview).not.toHaveBeenCalled();
    });
});
