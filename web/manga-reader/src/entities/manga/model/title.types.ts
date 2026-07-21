import { type Chapter } from '@entities/chapter/@x/manga';

export type AuthorRole = 'AUTHOR' | 'ARTIST' | 'STORY' | 'LETTERER' | 'COLORIST' | 'EDITOR';

export type TitleAuthor = {
    authorId: number;
    name: string;
    slug: string;
    role: AuthorRole;
};

export type TitlePublisher = {
    publisherId: number;
    name: string;
    slug: string;
};

export type Title = {
    id: string;
    type: string;
    cover: string;
    name: string;
    synopsis: string;
    genres: string[];
    // Capítulos não vêm mais embarcados no Title (DT-17) — buscados via
    // endpoint paginado /api/titles/{id}/chapters. Opcional para compat.
    chapters?: Chapter[];
    // Desnormalizados pelo api (DT-19) para os badges de catálogo.
    chaptersCount?: number;
    latestChapterNumber?: string;
    popularity: string;
    ratingAverage: number;
    ratingCount: number;
    adult: boolean;
    status: string;
    author: string;
    artist: string;
    publisher: string;
    authors: TitleAuthor[];
    publishers: TitlePublisher[];
    createdAt: string;
    updatedAt: string;
};
