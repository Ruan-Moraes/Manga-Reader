import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/model';

import { normalizeReadingProgress, type ReadingProgress, reportInvalidReadingProgress } from '../model/readingProgress';

export const readingProgressQueryKeys = {
    all: ['reading-progress'] as const,
    byTitle: (identityEpoch: number, titleId: string) => ['reading-progress', identityEpoch, titleId] as const,
};

export async function getReadingProgress(titleId: string, signal?: AbortSignal): Promise<ReadingProgress | null> {
    const response = await api.get<ApiResponse<unknown>>(`/users/me/reading-progress/${encodeURIComponent(titleId)}`, { signal });
    const progress = normalizeReadingProgress(response.data.data);
    if (response.data.data !== null && response.data.data !== undefined && progress === null) reportInvalidReadingProgress(titleId);
    return progress;
}
