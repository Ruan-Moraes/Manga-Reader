import { ChapterTypes } from './ChapterTypes';

export type TitleTypes = {
    id: string;
    type: string;
    cover: string;
    name: string;
    synopsis: string;
    genres: string[];
    chapters: ChapterTypes[];
    popularity: string;
    score: string;
    author: string;
    artist: string;
    publisher: string;
    createdAt: string;
    updatedAt: string;
};
