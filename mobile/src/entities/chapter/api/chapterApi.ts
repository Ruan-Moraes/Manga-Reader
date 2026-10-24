import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/model';

import { type Chapter, mapReaderChapter } from '../model/chapter';

export const chapterQueryKeys = {
    all: ['chapter'] as const,
    reader: (titleId: string, number: string) => ['chapter', 'reader', titleId, number] as const,
};

export const chapterReaderQueryKey = (titleId: string, number: string) => chapterQueryKeys.reader(titleId, number);

export const chapterReaderQueryOptions = (titleId: string, number: string) => ({
    queryKey: chapterReaderQueryKey(titleId, number),
    queryFn: ({ signal }: { signal: AbortSignal }) => getChapterForReader(titleId, number, signal),
    meta: { localeDependent: true },
});

export async function getChapterForReader(titleId: string, number: string, signal?: AbortSignal): Promise<Chapter | null> {
    const response = await api.get<ApiResponse<unknown>>(`/titles/${encodeURIComponent(titleId)}/chapters/${encodeURIComponent(number)}/reader`, { signal });

    return mapReaderChapter(response.data.data);
}
