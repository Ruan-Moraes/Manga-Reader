import {
    simulateDelay,
    getFromStorage,
    saveToStorage,
} from '@shared/service/mockApi';
import { mockLibrary } from '@mock/data/library';

import { type ReadingListType, type UserSavedLibrary } from '../type/favorite.types';

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'manga-reader:saved-library';

const getLibrary = (): UserSavedLibrary[] =>
    getFromStorage<UserSavedLibrary[]>(STORAGE_KEY, mockLibrary);

const saveLibrary = (data: UserSavedLibrary[]) =>
    saveToStorage(STORAGE_KEY, data);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getUserLibrary = async (
    userId: string,
): Promise<UserSavedLibrary | null> => {
    await simulateDelay(100);

    return getLibrary().find(u => u.userId === userId) ?? null;
};

export const toggleSavedManga = async (data: {
    userId: string;
    title: { titleId: string; name: string; cover: string; type: string };
    defaultList?: ReadingListType;
}): Promise<{ isSaved: boolean }> => {
    await simulateDelay(200);

    const users = getLibrary();
    const { userId, title, defaultList = 'Quero Ler' } = data;

    const userIndex = users.findIndex(u => u.userId === userId);

    if (userIndex === -1) {
        users.push({
            userId,
            name: 'Novo Usuário',
            savedMangas: [{ ...title, list: defaultList, savedAt: new Date().toISOString() }],
        });
        saveLibrary(users);
        return { isSaved: true };
    }

    const alreadySaved = users[userIndex].savedMangas.some(
        m => m.titleId === title.titleId,
    );

    users[userIndex].savedMangas = alreadySaved
        ? users[userIndex].savedMangas.filter(m => m.titleId !== title.titleId)
        : [
              ...users[userIndex].savedMangas,
              { ...title, list: defaultList, savedAt: new Date().toISOString() },
          ];

    saveLibrary(users);

    return { isSaved: !alreadySaved };
};

export const updateSavedMangaList = async (data: {
    userId: string;
    titleId: string;
    list: ReadingListType;
}): Promise<void> => {
    await simulateDelay(100);

    const users = getLibrary();
    const user = users.find(u => u.userId === data.userId);

    if (!user) return;

    user.savedMangas = user.savedMangas.map(m =>
        m.titleId === data.titleId ? { ...m, list: data.list } : m,
    );

    saveLibrary(users);
};

export const removeSavedManga = async (
    userId: string,
    titleId: string,
): Promise<void> => {
    await simulateDelay(100);

    const users = getLibrary();
    const user = users.find(u => u.userId === userId);

    if (!user) return;

    user.savedMangas = user.savedMangas.filter(m => m.titleId !== titleId);
    saveLibrary(users);
};
