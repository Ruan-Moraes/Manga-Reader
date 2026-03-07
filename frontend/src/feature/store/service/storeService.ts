import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type Store } from '../type/store.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getStores = async (
    page = 0,
    size = 20,
): Promise<PageResponse<Store>> => {
    const response = await api.get<ApiResponse<PageResponse<Store>>>(
        API_URLS.STORES,
        { params: { page, size } },
    );

    return response.data.data;
};

export const getStoresByTitleId = async (
    titleId: string,
    page = 0,
    size = 20,
): Promise<PageResponse<Store>> => {
    const response = await api.get<ApiResponse<PageResponse<Store>>>(
        `${API_URLS.STORES}/title/${titleId}`,
        { params: { page, size } },
    );

    return response.data.data;
};
