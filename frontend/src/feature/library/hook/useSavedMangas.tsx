import { useCallback, useEffect, useState } from 'react';

import { getStoredSession } from '@feature/auth/service/authService';
import { showErrorToast } from '@shared/service/util/toastService';

import {
    getLibraryCounts,
    getUserLibrary,
    getUserLibraryByList,
    removeSavedManga as removeSavedMangaService,
    saveToLibrary,
    updateSavedMangaList,
} from '../service/libraryService';
import {
    type LibraryCounts,
    type ReadingListType,
    type SavedMangaItem,
} from '../type/saved-library.types';

type ActiveTab = ReadingListType | 'Todos';

const useSavedMangas = (initialTab: ActiveTab = 'Todos') => {
    const [items, setItems] = useState<SavedMangaItem[]>([]);
    const [counts, setCounts] = useState<LibraryCounts>({ lendo: 0, queroLer: 0, concluido: 0, total: 0 });
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const fetchItems = useCallback(async (tab: ActiveTab, page = 0, append = false) => {
        const session = getStoredSession();
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            if (!append) setLoading(true);

            const result = tab === 'Todos'
                ? await getUserLibrary(page, 20)
                : await getUserLibraryByList(tab, page, 20);

            setItems(prev => append ? [...prev, ...result.content] : result.content);
            setCurrentPage(page);
            setHasMore(!result.last);
        } catch {
            setError('Erro ao carregar biblioteca.');
            if (!append) setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCounts = useCallback(async () => {
        const session = getStoredSession();
        if (!session) return;

        try {
            const data = await getLibraryCounts();
            setCounts(data);
        } catch {
            // silent — counts are non-critical
        }
    }, []);

    useEffect(() => {
        fetchItems(activeTab);
        fetchCounts();
    }, [activeTab, fetchItems, fetchCounts]);

    const changeTab = useCallback((tab: ActiveTab) => {
        setActiveTab(tab);
    }, []);

    const loadMore = useCallback(() => {
        fetchItems(activeTab, currentPage + 1, true);
    }, [activeTab, currentPage, fetchItems]);

    const changeList = useCallback(
        async (titleId: string, newList: ReadingListType) => {
            const prev = items;
            const prevCounts = counts;

            // Optimistic: remove from current filtered view
            const item = items.find(m => m.titleId === titleId);
            if (activeTab !== 'Todos' && item) {
                setItems(items.filter(m => m.titleId !== titleId));
            } else if (item) {
                setItems(items.map(m => m.titleId === titleId ? { ...m, list: newList } : m));
            }

            // Optimistic count update
            if (item) {
                const countKey = (list: ReadingListType) =>
                    list === 'Lendo' ? 'lendo' : list === 'Quero Ler' ? 'queroLer' : 'concluido';
                setCounts(c => ({
                    ...c,
                    [countKey(item.list)]: Math.max(0, c[countKey(item.list)] - 1),
                    [countKey(newList)]: c[countKey(newList)] + 1,
                }));
            }

            try {
                await updateSavedMangaList({ titleId, list: newList });
            } catch {
                setItems(prev);
                setCounts(prevCounts);
                showErrorToast('Erro ao alterar lista.');
            }
        },
        [items, counts, activeTab],
    );

    const removeFromSaved = useCallback(
        async (titleId: string) => {
            const prev = items;
            const prevCounts = counts;
            const item = items.find(m => m.titleId === titleId);

            // Optimistic remove
            setItems(items.filter(m => m.titleId !== titleId));
            if (item) {
                const countKey = (list: ReadingListType) =>
                    list === 'Lendo' ? 'lendo' : list === 'Quero Ler' ? 'queroLer' : 'concluido';
                setCounts(c => ({
                    ...c,
                    [countKey(item.list)]: Math.max(0, c[countKey(item.list)] - 1),
                    total: Math.max(0, c.total - 1),
                }));
            }

            try {
                await removeSavedMangaService(titleId);
            } catch {
                setItems(prev);
                setCounts(prevCounts);
                showErrorToast('Erro ao remover da biblioteca.');
            }
        },
        [items, counts],
    );

    const toggleFavorite = useCallback(
        async (title: { titleId: string; name: string; cover: string; type: string }) => {
            const alreadySaved = items.some(m => m.titleId === title.titleId);

            if (alreadySaved) {
                await removeSavedMangaService(title.titleId);
                setItems(prev => prev.filter(m => m.titleId !== title.titleId));
                setCounts(c => ({ ...c, total: Math.max(0, c.total - 1) }));
                return false;
            }

            await saveToLibrary({ titleId: title.titleId });
            setCounts(c => ({ ...c, queroLer: c.queroLer + 1, total: c.total + 1 }));
            return true;
        },
        [items],
    );

    const isSaved = useCallback(
        (titleId: string) => items.some(m => m.titleId === titleId),
        [items],
    );

    const retry = useCallback(() => {
        fetchItems(activeTab);
        fetchCounts();
    }, [activeTab, fetchItems, fetchCounts]);

    return {
        items,
        counts,
        activeTab,
        loading,
        error,
        hasMore,
        changeTab,
        loadMore,
        changeList,
        removeFromSaved,
        toggleFavorite,
        isSaved,
        retry,
    };
};

export default useSavedMangas;
