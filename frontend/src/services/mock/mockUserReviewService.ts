import { MangaRating } from '../../types/RatingTypes';

const STORAGE_KEY = 'manga-reader:user-reviews';

const mockUserReviews: MangaRating[] = [
    {
        id: 'review-1',
        titleId: '1',
        userName: 'Você',
        stars: 5,
        comment: 'Arte absurda e narrativa muito envolvente.',
        createdAt: '2026-01-24T11:40:00.000Z',
    },
    {
        id: 'review-2',
        titleId: '2',
        userName: 'Você',
        stars: 4,
        comment: 'Excelente começo, quero ver os próximos arcos.',
        createdAt: '2026-01-28T17:15:00.000Z',
    },
];

const getReviewsStore = () => {
    const storage = localStorage.getItem(STORAGE_KEY);

    if (!storage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUserReviews));

        return mockUserReviews;
    }

    return JSON.parse(storage) as MangaRating[];
};

const saveReviewsStore = (reviews: MangaRating[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
};

export const getUserReviews = () => getReviewsStore();

export const updateUserReview = ({
    id,
    stars,
    comment,
}: {
    id: string;
    stars: number;
    comment?: string;
}) => {
    const reviews = getReviewsStore();

    const updated = reviews.map(review =>
        review.id === id
            ? { ...review, stars, comment, createdAt: new Date().toISOString() }
            : review,
    );

    saveReviewsStore(updated);
};

export const deleteUserReview = (id: string) => {
    const reviews = getReviewsStore().filter(review => review.id !== id);

    saveReviewsStore(reviews);
};
