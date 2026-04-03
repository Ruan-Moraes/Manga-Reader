import { useCallback, useEffect, useState } from 'react';

import { getStoredSession } from '@feature/auth/service/authService';
import { requireAuth } from '@shared/service/util/requireAuth';

import {
    getUserLibrary,
    removeSavedManga,
    saveToLibrary,
} from '../service/libraryService';

const useBookmark = () => {
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const session = getStoredSession();
        if (!session) return;

        getUserLibrary(0, 1000)
            .then(page => {
                setSavedIds(new Set(page.content.map(m => m.titleId)));
            })
            .catch(() => {});
    }, []);

    const isSaved = useCallback(
        (titleId: string) => savedIds.has(titleId),
        [savedIds],
    );

    const toggleBookmark = useCallback(
        async ({
            titleId,
            name,
            cover,
            type,
        }: {
            titleId: string;
            name: string;
            cover: string;
            type: string;
        }) => {
            if (!requireAuth('salvar na biblioteca')) return false;

            if (savedIds.has(titleId)) {
                setSavedIds(prev => {
                    const next = new Set(prev);
                    next.delete(titleId);
                    return next;
                });
                try {
                    await removeSavedManga(titleId);
                } catch {
                    setSavedIds(prev => new Set(prev).add(titleId));
                }
                return false;
            }

            setSavedIds(prev => new Set(prev).add(titleId));
            try {
                await saveToLibrary({ titleId, list: 'Quero Ler' });
            } catch {
                setSavedIds(prev => {
                    const next = new Set(prev);
                    next.delete(titleId);
                    return next;
                });
            }
            // suppress unused var warnings
            void name;
            void cover;
            void type;
            return true;
        },
        [savedIds],
    );

    return { toggleBookmark, isSaved };
};

export default useBookmark;
