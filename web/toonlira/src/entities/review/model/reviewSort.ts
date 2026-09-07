/** Ordenações disponíveis na aba de resenhas → campo/direção do backend. */
export type ReviewSortKey = 'top' | 'recent' | 'high' | 'low';

export const REVIEW_SORT_KEYS: ReviewSortKey[] = ['top', 'recent', 'high', 'low'];

export const REVIEW_SORT: Record<ReviewSortKey, { sort: string; direction: 'asc' | 'desc' }> = {
    top: { sort: 'upvotes', direction: 'desc' },
    recent: { sort: 'createdAt', direction: 'desc' },
    high: { sort: 'overallRating', direction: 'desc' },
    low: { sort: 'overallRating', direction: 'asc' },
};
