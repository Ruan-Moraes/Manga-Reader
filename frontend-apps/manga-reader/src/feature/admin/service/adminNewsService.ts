import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminNews,
    CreateNewsRequest,
    UpdateNewsRequest,
} from '../type/admin.types';

export const getAdminNews = async (
    page = 0,
    size = 20,
    search?: string,
    sort = 'publishedAt',
    direction = 'desc',
): Promise<PageResponse<AdminNews>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminNews>>>(
        API_URLS.ADMIN_NEWS,
        { params: { page, size, search, sort, direction } },
    );
    return response.data.data;
};

export const getAdminNewsDetail = async (
    newsId: string,
): Promise<AdminNews> => {
    const response = await api.get<ApiResponse<AdminNews>>(
        `${API_URLS.ADMIN_NEWS}/${newsId}`,
    );
    return response.data.data;
};

export const createNews = async (
    data: CreateNewsRequest,
): Promise<AdminNews> => {
    const response = await api.post<ApiResponse<AdminNews>>(
        API_URLS.ADMIN_NEWS,
        data,
    );
    return response.data.data;
};

export const updateNews = async (
    newsId: string,
    data: UpdateNewsRequest,
): Promise<AdminNews> => {
    const response = await api.patch<ApiResponse<AdminNews>>(
        `${API_URLS.ADMIN_NEWS}/${newsId}`,
        data,
    );
    return response.data.data;
};

export const deleteNews = async (newsId: string): Promise<void> => {
    await api.delete(`${API_URLS.ADMIN_NEWS}/${newsId}`);
};
