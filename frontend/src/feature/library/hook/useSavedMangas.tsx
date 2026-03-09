import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    getUserLibrary,
    removeSavedManga as removeSavedMangaService,
    saveToLibrary,
    updateSavedMangaList,
} from '../service/libraryService';
import { ReadingListType, SavedMangaItem } from '../type/saved-library.types';

const useSavedMangas = () => {
    const [savedMangas, setSavedMangas] = useState<SavedMangaItem[]>([]);

    const loadLibrary = useCallback(async () => {
        const page = await getUserLibrary();
        setSavedMangas(page.content);
    }, []);

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
            const alreadySaved = savedMangas.some(
                m => m.titleId === title.titleId,
            );

            if (alreadySaved) {
                await removeSavedMangaService(title.titleId);
                await loadLibrary();
                return false;
            }

            await saveToLibrary({ titleId: title.titleId });
            await loadLibrary();
            return true;
        },
        [loadLibrary, savedMangas],
    );

    const changeList = useCallback(
        async (titleId: string, list: ReadingListType) => {
            await updateSavedMangaList({ titleId, list });
            await loadLibrary();
        },
        [loadLibrary],
    );

    const removeFromSaved = useCallback(
        async (titleId: string) => {
            await removeSavedMangaService(titleId);
            await loadLibrary();
        },
        [loadLibrary],
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
