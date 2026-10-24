import { API_URLS } from '@shared/constant/API_URLS';
import { api, type ApiResponse } from '@shared/service/http';

import type { ReleaseFeed, ReleaseQuery } from '../model/release.types';

export const getReleaseFeed = async (query: ReleaseQuery): Promise<ReleaseFeed> => {
    const response = await api.get<ApiResponse<ReleaseFeed>>(API_URLS.RELEASES, {
        params: {
            ...query,
            q: query.q || undefined,
            language: query.language || undefined,
            size: query.size ?? 30,
        },
    });
    return response.data.data;
};
