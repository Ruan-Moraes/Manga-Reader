import type { ReadingProgress } from '@/src/entities/reading-progress';
import { api } from '@/src/shared/api';

export async function putReadingProgress(progress: ReadingProgress, signal?: AbortSignal): Promise<void> {
    await api.put('/users/me/reading-progress', progress, { signal });
}
