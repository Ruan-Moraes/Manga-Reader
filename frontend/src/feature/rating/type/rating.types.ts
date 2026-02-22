export type CategoryRatings = Record<string, number>;

export type MangaRating = {
    id: string;
    titleId: string;
    userName: string;
    stars: number;
    comment?: string;
    categoryRatings?: CategoryRatings;
    createdAt: string;
};
