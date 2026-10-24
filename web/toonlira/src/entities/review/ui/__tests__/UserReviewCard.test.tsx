import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Review } from '../../model/review.types';
import { UserReviewCard } from '../UserReviewCard';

const review: Review = {
    id: 'review-1',
    titleId: 'title-1',
    titleName: 'Berserk',
    userId: 'user-1',
    userName: 'Leitor',
    overallRating: 4.5,
    funRating: 4,
    artRating: 5,
    storylineRating: 5,
    charactersRating: 4.5,
    originalityRating: 4,
    pacingRating: 4,
    comment: 'Uma obra-prima.',
    reviewTitle: 'Um clássico',
    createdAt: '2026-06-12T12:00:00Z',
    updatedAt: '2026-06-13T12:00:00Z',
    edited: true,
    top: true,
    upvotes: 12,
    downvotes: 2,
    cover: 'https://example.com/berserk.jpg',
    genres: ['Seinen', 'Fantasia'],
};

describe('UserReviewCard', () => {
    it('adapta todos os dados enriquecidos para o padrão centrado na obra', async () => {
        const user = userEvent.setup();
        const onOpenTitle = vi.fn();
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        const { container } = render(<UserReviewCard review={review} onOpenTitle={onOpenTitle} actions={{ onEdit, onDelete }} />);

        await user.click(screen.getByRole('button', { name: 'Berserk' }));

        expect(onOpenTitle).toHaveBeenCalledWith('title-1');
        expect(container.querySelector('img')).toHaveAttribute('src', review.cover);
        expect(screen.getByText('Seinen')).toBeInTheDocument();
        expect(screen.getByText('Fantasia')).toBeInTheDocument();
        expect(screen.getByText('Um clássico')).toBeInTheDocument();
        expect(screen.getByText('Uma obra-prima.')).toBeInTheDocument();
        expect(screen.getByText('(editado)')).toBeInTheDocument();
        expect(screen.getAllByText('4.5')).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
    });

    it('mantém o mesmo card quando capa, gêneros e título da obra não estão disponíveis', () => {
        const { container } = render(
            <UserReviewCard
                review={{ ...review, titleName: undefined, cover: undefined, genres: undefined }}
                onOpenTitle={() => {}}
            />,
        );

        expect(screen.getByRole('button', { name: 'Obra #title-1' })).toBeInTheDocument();
        expect(container.querySelector('img')).not.toBeInTheDocument();
        expect(screen.queryByText('Seinen')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
    });
});
