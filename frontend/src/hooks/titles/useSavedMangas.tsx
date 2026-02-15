import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    getUserLibrary,
    removeSavedManga,
    toggleSavedManga,
    updateSavedMangaList,
} from '../../services/mock/mockUserLibraryService';
import { ReadingListType, SavedMangaItem } from '../../types/FavoriteTypes';

const useSavedMangas = (userId = 'user-1') => {
    const [savedMangas, setSavedMangas] = useState<SavedMangaItem[]>([]);

    const loadLibrary = useCallback(() => {
        const userLibrary = getUserLibrary(userId);

        setSavedMangas(userLibrary?.savedMangas ?? []);
    }, [userId]);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);

    const toggleFavorite = useCallback(
        (title: {
            titleId: string;
            name: string;
            cover: string;
            type: string;
        }) => {
            const response = toggleSavedManga({ userId, title });

            loadLibrary();

            return response.isSaved;
        },
        [loadLibrary, userId],
    );

    const changeList = useCallback(
        (titleId: string, list: ReadingListType) => {
            updateSavedMangaList({ userId, titleId, list });
            loadLibrary();
        },
        [loadLibrary, userId],
    );

    const removeFromSaved = useCallback(
        (titleId: string) => {
            removeSavedManga(userId, titleId);
            loadLibrary();
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
