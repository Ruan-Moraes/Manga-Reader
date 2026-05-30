export type MangaRating = {
    id: string;
    titleId: string;
    titleName?: string;
    userName: string;
    overallRating: number;
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
    comment?: string;
    createdAt: string;
};
