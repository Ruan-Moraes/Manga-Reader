import { api } from '@shared/service/http';
import type { ApiResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type Tag } from '../type/tag.types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getTags = async (): Promise<Tag[]> => {
    const response = await api.get<ApiResponse<Tag[]>>(API_URLS.TAGS);

    return response.data.data;
};

export const getTagById = async (id: number): Promise<Tag> => {
    const response = await api.get<ApiResponse<Tag>>(`${API_URLS.TAGS}/${id}`);

    return response.data.data;
};
