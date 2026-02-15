import { simulateDelay } from '@shared/service/mockApi';
import { mockTitles } from '@mock/data/titles';

import { type Title } from '../type/title.types';

// ---------------------------------------------------------------------------
// Title Service — substitui fetch() para a API real
// ---------------------------------------------------------------------------

export const getTitles = async (): Promise<Title[]> => {
    await simulateDelay();
    return mockTitles;
};

export const getTitleById = async (id: number | string): Promise<Title> => {
    await simulateDelay();

    const title = mockTitles.find(t => t.id === String(id));

    if (!title) {
        throw new Error(`Título com id "${id}" não encontrado.`);
    }

    return title;
};

export const searchTitles = async (query: string): Promise<Title[]> => {
    await simulateDelay();

    const normalised = query.trim().toLowerCase();

    return mockTitles.filter(
        t =>
            t.name.toLowerCase().includes(normalised) ||
            t.synopsis.toLowerCase().includes(normalised) ||
            t.genres.some(g => g.toLowerCase().includes(normalised)),
    );
};

export const getTitlesByGenre = async (genre: string): Promise<Title[]> => {
    await simulateDelay();

    return mockTitles.filter(t =>
        t.genres.some(g => g.toLowerCase() === genre.toLowerCase()),
    );
};
