import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MangaRating, RatingDistribution } from '@entities/rating';
import ReviewsTab from '../parts/ReviewsTab';

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

describe('ReviewsTab', () => {
    it('calls onWriteReview when the write-review button is clicked', async () => {
        const onWriteReview = vi.fn();
        const user = userEvent.setup();

        render(<ReviewsTab ratings={[]} average={average} distribution={distribution} onWriteReview={onWriteReview} />);

        await user.click(screen.getByRole('button', { name: /escrever resenha/i }));

        expect(onWriteReview).toHaveBeenCalledOnce();
    });

    it('renders the empty state when there are no ratings', () => {
        render(<ReviewsTab ratings={[]} average={average} distribution={distribution} onWriteReview={() => {}} />);

        expect(screen.getByText(/nenhuma resenha/i)).toBeInTheDocument();
    });

    it('renders a review comment when ratings are present', () => {
        render(<ReviewsTab ratings={[buildRating()]} average={average} distribution={distribution} onWriteReview={() => {}} />);

        expect(screen.getByText('Obra-prima absoluta.')).toBeInTheDocument();
    });

    it('renders the real rating distribution as percentages', () => {
        render(<ReviewsTab ratings={[]} average={average} distribution={distribution} onWriteReview={() => {}} />);

        // 70/100 → 70% for 5 stars, 20% for 4 stars
        expect(screen.getByText('70%')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('shows 0% bars when there are no ratings to distribute', () => {
        const empty: RatingDistribution = { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0, total: 0 };
        render(<ReviewsTab ratings={[]} average={{ average: 0, count: 0 }} distribution={empty} onWriteReview={() => {}} />);

        expect(screen.getAllByText('0%')).toHaveLength(5);
    });
});
