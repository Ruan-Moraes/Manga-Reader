import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type Chapter } from '../type/chapter.types';

// ---------------------------------------------------------------------------
// Chapter Service
// ---------------------------------------------------------------------------

export const getChaptersByTitleId = async (titleId: string, page = 0, size = 50, direction: 'asc' | 'desc' = 'asc'): Promise<PageResponse<Chapter>> => {
    const response = await api.get<ApiResponse<PageResponse<Chapter>>>(`${API_URLS.TITLES}/${titleId}/chapters`, { params: { page, size, direction } });

    return response.data.data;
};

export const getChapterByNumber = async (titleId: string, chapterNumber: string): Promise<Chapter> => {
    const response = await api.get<ApiResponse<Chapter>>(`${API_URLS.TITLES}/${titleId}/chapters/${chapterNumber}`);

    return response.data.data;
};
