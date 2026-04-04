import { type Chapter } from '@feature/chapter';

export type Title = {
    id: string;
    type: string;
    cover: string;
    name: string;
    synopsis: string;
    genres: string[];
    chapters: Chapter[];
    popularity: string;
    ratingAverage: number;
    ratingCount: number;
    rankingScore: number;
    adult: boolean;
    status: string;
    author: string;
    artist: string;
    publisher: string;
    createdAt: string;
    updatedAt: string;
};
