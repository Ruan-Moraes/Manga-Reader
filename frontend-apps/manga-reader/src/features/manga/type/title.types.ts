import { type Chapter } from '@features/chapter';

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
    // Desnormalizados pelo backend (DT-19) para os badges de catálogo.
    chaptersCount?: number;
    latestChapterNumber?: string;
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
