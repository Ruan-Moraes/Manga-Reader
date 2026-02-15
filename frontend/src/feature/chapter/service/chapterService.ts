import { simulateDelay } from '@shared/service/mockApi';
import { mockTitles } from '@mock/data/titles';

import { type Chapter } from '../type/chapter.types';

// ---------------------------------------------------------------------------
// Chapter Service
// ---------------------------------------------------------------------------

export const getChaptersByTitleId = async (
    titleId: string,
): Promise<Chapter[]> => {
    await simulateDelay();

    const title = mockTitles.find(t => t.id === titleId);

    return title?.chapters ?? [];
};

export const getChapterByNumber = async (
    titleId: string,
    chapterNumber: string,
): Promise<Chapter | undefined> => {
    await simulateDelay();

    const title = mockTitles.find(t => t.id === titleId);

    return title?.chapters.find(ch => ch.number === chapterNumber);
};
