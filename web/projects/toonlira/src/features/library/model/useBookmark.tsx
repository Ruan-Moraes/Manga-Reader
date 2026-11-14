import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getStoredSession } from '@shared/service/session';
import { requireAuth } from '@shared/service/util/requireAuth';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getUserLibrary, removeSavedManga, saveToLibrary } from '../api/libraryService';

const STALE_TIME = 1000 * 60 * 30;
const MAX_IDS = 500;

const QUERY_KEY = [QUERY_KEYS.LIBRARY_IDS] as const;

const useBookmark = () => {
    const session = getStoredSession();
    const queryClient = useQueryClient();

    const { data: savedIds = new Set<string>() } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            const page = await getUserLibrary(0, MAX_IDS);
            return new Set(page.content.map(m => m.titleId));
        },
        enabled: !!session,
        staleTime: STALE_TIME,
    });

    const isSaved = useCallback((titleId: string) => savedIds.has(titleId), [savedIds]);

    const toggleBookmark = useCallback(
        async (titleId: string) => {
            if (!requireAuth('salvar na biblioteca')) return false;

            if (savedIds.has(titleId)) {
                queryClient.setQueryData(QUERY_KEY, (prev: Set<string>) => {
                    const next = new Set(prev);
                    next.delete(titleId);
                    return next;
                });
                try {
                    await removeSavedManga(titleId);
                } catch {
                    queryClient.setQueryData(QUERY_KEY, (prev: Set<string>) => new Set(prev).add(titleId));
                }
                return false;
            }

            queryClient.setQueryData(QUERY_KEY, (prev: Set<string>) => new Set(prev).add(titleId));
            try {
                await saveToLibrary({ titleId, list: 'Quero Ler' });
            } catch {
                queryClient.setQueryData(QUERY_KEY, (prev: Set<string>) => {
                    const next = new Set(prev);
                    next.delete(titleId);
                    return next;
                });
            }

            return true;
        },
        [savedIds, queryClient],
    );

    return { toggleBookmark, isSaved };
};

export default useBookmark;
