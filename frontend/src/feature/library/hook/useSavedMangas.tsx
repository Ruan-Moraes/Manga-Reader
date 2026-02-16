import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    getUserLibrary,
    removeSavedManga as removeSavedMangaService,
    toggleSavedManga as toggleSavedMangaService,
    updateSavedMangaList,
} from '../service/libraryService';
import { ReadingListType, SavedMangaItem } from '../type/saved-library.types';

const useSavedMangas = (userId = 'user-1') => {
    const [savedMangas, setSavedMangas] = useState<SavedMangaItem[]>([]);

    const loadLibrary = useCallback(async () => {
        const userLibrary = await getUserLibrary(userId);
        setSavedMangas(userLibrary?.savedMangas ?? []);
    }, [userId]);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);

    const toggleFavorite = useCallback(
        async (title: {
            titleId: string;
            name: string;
            cover: string;
            type: string;
        }) => {
            const response = await toggleSavedMangaService({ userId, title });
            await loadLibrary();
            return response.isSaved;
        },
        [loadLibrary, userId],
    );

    const changeList = useCallback(
        async (titleId: string, list: ReadingListType) => {
            await updateSavedMangaList({ userId, titleId, list });
            await loadLibrary();
        },
        [loadLibrary, userId],
    );

    const removeFromSaved = useCallback(
        async (titleId: string) => {
            await removeSavedMangaService(userId, titleId);
            await loadLibrary();
        },
        [loadLibrary, userId],
    );

    const savedByList = useMemo(
        () => ({
            Lendo: savedMangas.filter(manga => manga.list === 'Lendo'),
            'Quero Ler': savedMangas.filter(
                manga => manga.list === 'Quero Ler',
            ),
            Concluído: savedMangas.filter(manga => manga.list === 'Concluído'),
        }),
        [savedMangas],
    );

    const isSaved = useCallback(
        (titleId: string) =>
            savedMangas.some(manga => manga.titleId === titleId),
        [savedMangas],
    );

    return {
        savedMangas,
        savedByList,
        isSaved,
        toggleFavorite,
        changeList,
        removeFromSaved,
    };
};

export default useSavedMangas;
