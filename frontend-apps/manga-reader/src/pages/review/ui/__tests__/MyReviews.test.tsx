import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import MyReviews from '../MyReviews';

vi.mock('@entities/rating', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/rating')>();
    return {
        ...actual,
        getUserReviews: vi.fn(),
        updateReview: vi.fn(),
        deleteReview: vi.fn(),
    };
});

vi.mock('@shared/service/util/toastService');

import { getUserReviews } from '@entities/rating';

const mockReview = {
    id: 'r1',
    titleId: 't1',
    titleName: 'Berserk',
    userName: 'Leitor',
    overallRating: 4.5,
    funRating: 5,
    artRating: 5,
    storylineRating: 4,
    charactersRating: 4,
    originalityRating: 4,
    pacingRating: 4,
    comment: 'Obra prima.',
    createdAt: '2026-01-01T00:00:00Z',
};

describe('MyReviews', () => {
    beforeEach(() => {
        vi.mocked(getUserReviews).mockResolvedValue({
            content: [],
            page: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0,
            last: true,
        });
    });

    it('renders page title', async () => {
        renderWithProviders(<MyReviews />);
        await waitFor(() => expect(screen.getByText('Minhas Avaliações')).toBeInTheDocument());
    });

    it('shows empty state when no reviews', async () => {
        renderWithProviders(<MyReviews />);
        await waitFor(() => expect(screen.getByText(/nenhuma avaliação ainda/i)).toBeInTheDocument());
    });

    it('shows loading skeleton initially', () => {
        vi.mocked(getUserReviews).mockImplementation(() => new Promise(() => {}));
        const { container } = renderWithProviders(<MyReviews />);
        expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy();
    });

    it('renders review cards when data available', async () => {
        vi.mocked(getUserReviews).mockResolvedValue({
            content: [mockReview],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            last: true,
        });
        renderWithProviders(<MyReviews />);
        await waitFor(() => expect(screen.getByText('Berserk')).toBeInTheDocument());
    });

    it('shows load-more button when hasMore', async () => {
        vi.mocked(getUserReviews).mockResolvedValue({
            content: [mockReview],
            page: 0,
            size: 10,
            totalElements: 2,
            totalPages: 2,
            last: false,
        });
        renderWithProviders(<MyReviews />);
        await waitFor(() => expect(screen.getByText('Carregar mais')).toBeInTheDocument());
    });
});
