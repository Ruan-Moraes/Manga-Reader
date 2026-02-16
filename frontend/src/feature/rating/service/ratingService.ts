import {
    simulateDelay,
    getFromStorage,
    saveToStorage,
} from '@shared/service/mockApi';
import { mockRatings, mockUserReviews } from '@mock/data/ratings';

import { type MangaRating } from '../type/rating.types';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const RATINGS_KEY = 'manga-reader:ratings';
const REVIEWS_KEY = 'manga-reader:user-reviews';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const getRatingsStore = (): Record<string, MangaRating[]> =>
    getFromStorage<Record<string, MangaRating[]>>(RATINGS_KEY, mockRatings);

const saveRatingsStore = (ratings: Record<string, MangaRating[]>) =>
    saveToStorage(RATINGS_KEY, ratings);

const getReviewsStore = (): MangaRating[] =>
    getFromStorage<MangaRating[]>(REVIEWS_KEY, mockUserReviews);

const saveReviewsStore = (reviews: MangaRating[]) =>
    saveToStorage(REVIEWS_KEY, reviews);

// ---------------------------------------------------------------------------
// Public API — Ratings
// ---------------------------------------------------------------------------

export const getRatingsByTitleId = async (
    titleId: string,
): Promise<MangaRating[]> => {
    await simulateDelay(100);

    const store = getRatingsStore();
    return store[titleId] ?? [];
};

export const getRatingsAverage = (titleId: string): number => {
    const store = getRatingsStore();
    const ratings = store[titleId] ?? [];

    if (!ratings.length) return 0;

    return ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length;
};

export const submitRating = async (data: {
    titleId: string;
    stars: number;
    comment?: string;
}): Promise<MangaRating> => {
    await simulateDelay(200);

    const store = getRatingsStore();

    const newRating: MangaRating = {
        id: `${data.titleId}-${Date.now()}`,
        titleId: data.titleId,
        userName: 'Você',
        stars: data.stars,
        comment: data.comment,
        createdAt: new Date().toISOString(),
    };

    store[data.titleId] = [newRating, ...(store[data.titleId] ?? [])];
    saveRatingsStore(store);

    // Sync to user reviews
    const reviews = getReviewsStore();
    saveReviewsStore([newRating, ...reviews]);

    return newRating;
};

// ---------------------------------------------------------------------------
// Public API — User Reviews
// ---------------------------------------------------------------------------

export const getUserReviews = async (): Promise<MangaRating[]> => {
    await simulateDelay(100);
    return getReviewsStore();
};

export const updateReview = async (data: {
    id: string;
    stars: number;
    comment?: string;
}): Promise<void> => {
    await simulateDelay(200);

    const reviews = getReviewsStore().map(r =>
        r.id === data.id
            ? {
                  ...r,
                  stars: data.stars,
                  comment: data.comment,
                  createdAt: new Date().toISOString(),
              }
            : r,
    );

    saveReviewsStore(reviews);
};

export const deleteReview = async (id: string): Promise<void> => {
    await simulateDelay(200);

    saveReviewsStore(getReviewsStore().filter(r => r.id !== id));
};

// ---------------------------------------------------------------------------
// Sync helpers — usados pelo componente Reviews (sem delay)
// ---------------------------------------------------------------------------

export const getUserReviewsSync = (): MangaRating[] => getReviewsStore();

export const updateUserReview = (data: {
    id: string;
    stars: number;
    comment?: string;
}): void => {
    const reviews = getReviewsStore().map(r =>
        r.id === data.id
            ? {
                  ...r,
                  stars: data.stars,
                  comment: data.comment,
                  createdAt: new Date().toISOString(),
              }
            : r,
    );
    saveReviewsStore(reviews);
};

export const deleteUserReview = (id: string): void => {
    saveReviewsStore(getReviewsStore().filter(r => r.id !== id));
};
