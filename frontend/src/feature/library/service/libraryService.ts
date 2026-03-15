import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type LibraryCounts, type ReadingListType, type SavedMangaItem } from '../type/saved-library.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getUserLibrary = async (
    page = 0,
    size = 20,
): Promise<PageResponse<SavedMangaItem>> => {
    const response = await api.get<ApiResponse<PageResponse<SavedMangaItem>>>(
        API_URLS.LIBRARY,
        { params: { page, size } },
    );

    return response.data.data;
};

export const saveToLibrary = async (data: {
    titleId: string;
    list?: ReadingListType;
}): Promise<SavedMangaItem> => {
    const response = await api.post<ApiResponse<SavedMangaItem>>(
        API_URLS.LIBRARY,
        { titleId: data.titleId, list: data.list ?? 'Quero Ler' },
    );

    return response.data.data;
};

export const updateSavedMangaList = async (data: {
    titleId: string;
    list: ReadingListType;
}): Promise<void> => {
    await api.patch(`${API_URLS.LIBRARY}/${data.titleId}`, {
        list: data.list,
    });
};

export const removeSavedManga = async (titleId: string): Promise<void> => {
    await api.delete(`${API_URLS.LIBRARY}/${titleId}`);
};

export const getUserLibraryByList = async (
    list: ReadingListType,
    page = 0,
    size = 20,
): Promise<PageResponse<SavedMangaItem>> => {
    const response = await api.get<ApiResponse<PageResponse<SavedMangaItem>>>(
        API_URLS.LIBRARY,
        { params: { list, page, size } },
    );

    return response.data.data;
};

export const getLibraryCounts = async (): Promise<LibraryCounts> => {
    const response = await api.get<ApiResponse<LibraryCounts>>(
        `${API_URLS.LIBRARY}/counts`,
    );

    return response.data.data;
};
