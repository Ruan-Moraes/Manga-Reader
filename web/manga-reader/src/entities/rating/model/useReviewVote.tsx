import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { PageResponse } from '@shared/service/http';
import { showErrorToast } from '@shared/service/util/toastService';

import { castReviewVote, removeReviewVote, type ReviewVoteResult } from '../api/ratingService';
import { type MangaRating } from './rating.types';

type Vote = 'up' | 'down';

type VoteVars = {
    id: string;
    value: Vote;
    /** Voto atual do usuário nessa resenha — decide entre registrar e remover. */
    currentVote: Vote | null;
};

type ReviewsCache = InfiniteData<PageResponse<MangaRating>>;

/** Aplica um transform a uma resenha específica em todas as páginas cacheadas. */
function mapReview(data: ReviewsCache | undefined, id: string, fn: (r: MangaRating) => MangaRating): ReviewsCache | undefined {
    if (!data) return data;

    return {
        ...data,
        pages: data.pages.map(page => ({
            ...page,
            content: page.content.map(review => (review.id === id ? fn(review) : review)),
        })),
    };
}

/** Ajuste otimista dos contadores ao mudar de `prev` para `next`. */
function applyOptimistic(review: MangaRating, prev: Vote | null, next: Vote | null): MangaRating {
    let up = review.upvotes ?? 0;
    let down = review.downvotes ?? 0;

    if (prev === 'up') up -= 1;
    if (prev === 'down') down -= 1;
    if (next === 'up') up += 1;
    if (next === 'down') down += 1;

    return { ...review, upvotes: Math.max(0, up), downvotes: Math.max(0, down), myVote: next };
}

/**
 * Voto Útil/Contrário em resenha (DT-47) com **verdade do servidor + otimista**:
 * `onMutate` ajusta o cache imediatamente; `onSuccess` grava os contadores reais
 * retornados pelo backend; `onError` faz rollback e mostra toast.
 */
const useReviewVote = (titleId: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('rating');

    const cacheKey = { queryKey: [QUERY_KEYS.RATINGS_BY_TITLE, titleId] };

    return useMutation<ReviewVoteResult, Error, VoteVars, { snapshot: [QueryKey, ReviewsCache | undefined][] }>({
        mutationFn: ({ id, value, currentVote }) => (currentVote === value ? removeReviewVote(id) : castReviewVote(id, value)),
        onMutate: async ({ id, value, currentVote }) => {
            await queryClient.cancelQueries(cacheKey);

            const snapshot = queryClient.getQueriesData<ReviewsCache>(cacheKey);
            const next: Vote | null = currentVote === value ? null : value;

            queryClient.setQueriesData<ReviewsCache>(cacheKey, old => mapReview(old, id, r => applyOptimistic(r, currentVote, next)));

            return { snapshot };
        },
        onError: (_error, _vars, context) => {
            context?.snapshot.forEach(([key, data]) => queryClient.setQueryData<ReviewsCache>(key, data));
            showErrorToast(t('reviews.voteError'));
        },
        onSuccess: (result, { id }) => {
            // Reconcilia com os contadores autoritativos do backend.
            queryClient.setQueriesData<ReviewsCache>(cacheKey, old =>
                mapReview(old, id, r => ({ ...r, upvotes: result.upvotes, downvotes: result.downvotes, myVote: result.myVote ?? null })),
            );
        },
    });
};

export default useReviewVote;
