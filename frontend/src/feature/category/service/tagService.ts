import { simulateDelay } from '@shared/service/mockApi';
import { mockTags } from '@mock/data/tags';

import { type Tag } from '../type/tag.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getTags = async (): Promise<Tag[]> => {
    await simulateDelay();
    return mockTags;
};

export const getTagById = async (
    id: number,
): Promise<Tag | undefined> => {
    await simulateDelay(100);
    return mockTags.find(t => t.value === id);
};
