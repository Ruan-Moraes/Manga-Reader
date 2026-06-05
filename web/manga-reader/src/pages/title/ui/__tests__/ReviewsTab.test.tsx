import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MangaRating, RatingDistribution } from '@entities/rating';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import ReviewsTab from '../parts/ReviewsTab';

vi.mock('@features/auth', () => ({
    useAuth: () => ({ isLoggedIn: false, user: null }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    AUTH_KEY: 'auth',
    buildLoginSchema: vi.fn(),
    buildSignUpSchema: vi.fn(),
    mapAuthResponseToUser: vi.fn(),
    requestPasswordReset: vi.fn(),
    AuthGuard: ({ children }: { children: React.ReactNode }) => children,
    RoleGuard: ({ children }: { children: React.ReactNode }) => children,
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

// renderWithProviders já inclui BrowserRouter (necessário para useAppNavigate)
const renderTab = (props: Partial<Parameters<typeof ReviewsTab>[0]> = {}) =>
    renderWithProviders(
        <ReviewsTab
            ratings={[]}
            average={average}
            distribution={distribution}
            onWriteReview={() => {}}
            {...props}
        />,
    );

describe('ReviewsTab', () => {
    it('renders login prompt when logged out and no ratings', () => {
        renderTab();
        expect(screen.getByText(/entre para avaliar/i)).toBeInTheDocument();
    });

    it('shows empty-state message when no ratings exist', () => {
        renderTab();
        expect(screen.getByText(/ainda sem resenhas/i)).toBeInTheDocument();
    });

    it('renders the rating summary section', () => {
        renderTab();
        expect(screen.getByRole('region', { name: /avaliação geral/i })).toBeInTheDocument();
    });

    it('renders a review comment when ratings are present', () => {
        renderTab({ ratings: [buildRating()] });
        expect(screen.getByText('Obra-prima absoluta.')).toBeInTheDocument();
    });

    it('renders the real rating distribution as percentages', () => {
        renderTab();
        // 70/100 = 70% for 5★, 20% for 4★
        expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('20%').length).toBeGreaterThanOrEqual(1);
    });

    it('shows 0% bars when there are no ratings to distribute', () => {
        const empty: RatingDistribution = { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0, total: 0 };
        renderTab({ average: { average: 0, count: 0 }, distribution: empty });
        expect(screen.getAllByText('0%')).toHaveLength(5);
    });

    it('clicking a star-row filters and shows the clear filter button', async () => {
        const user = userEvent.setup();
        renderTab({ ratings: [buildRating()] });
        await user.click(screen.getByTitle(/filtrar por 5 estrelas/i));
        expect(screen.getByText(/limpar filtro/i)).toBeInTheDocument();
    });

    it('shows "no reviews with N★" message when filter matches nothing', async () => {
        const user = userEvent.setup();
        // overallRating 4.8 → rounds to 5; filter 1★ → empty list
        renderTab({ ratings: [buildRating()] });
        await user.click(screen.getByTitle(/filtrar por 1 estrela/i));
        expect(screen.getByText(/nenhuma resenha com 1/i)).toBeInTheDocument();
    });

    it('"Entrar" navigates (does not call onWriteReview)', async () => {
        const onWriteReview = vi.fn();
        const user = userEvent.setup();
        renderTab({ onWriteReview });
        // Clica "Entrar" — agora redireciona para /login, não abre modal
        await user.click(screen.getByRole('button', { name: /^entrar$/i }));
        // navigate() é chamado sem erro; onWriteReview NÃO deve ser chamado
        expect(onWriteReview).not.toHaveBeenCalled();
    });

    it('"Criar conta" navigates (does not call onWriteReview)', async () => {
        const onWriteReview = vi.fn();
        const user = userEvent.setup();
        renderTab({ onWriteReview });
        await user.click(screen.getByRole('button', { name: /criar conta/i }));
        expect(onWriteReview).not.toHaveBeenCalled();
    });
});
