import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminUser,
    BanUserRequest,
    ChangeRoleRequest,
} from '../type/admin.types';

export const getAdminUsers = async (
    page = 0,
    size = 20,
    search?: string,
    sort = 'createdAt',
    direction = 'desc',
): Promise<PageResponse<AdminUser>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminUser>>>(
        API_URLS.ADMIN_USERS,
        { params: { page, size, search, sort, direction } },
    );
    return response.data.data;
};

export const getAdminUserDetail = async (
    userId: string,
): Promise<AdminUser> => {
    const response = await api.get<ApiResponse<AdminUser>>(
        `${API_URLS.ADMIN_USERS}/${userId}`,
    );
    return response.data.data;
};

export const changeUserRole = async (
    userId: string,
    data: ChangeRoleRequest,
): Promise<AdminUser> => {
    const response = await api.patch<ApiResponse<AdminUser>>(
        `${API_URLS.ADMIN_USERS}/${userId}/role`,
        data,
    );
    return response.data.data;
};

export const banUser = async (
    userId: string,
    data: BanUserRequest,
): Promise<AdminUser> => {
    const response = await api.post<ApiResponse<AdminUser>>(
        `${API_URLS.ADMIN_USERS}/${userId}/ban`,
        data,
    );
    return response.data.data;
};

export const unbanUser = async (userId: string): Promise<AdminUser> => {
    const response = await api.delete<ApiResponse<AdminUser>>(
        `${API_URLS.ADMIN_USERS}/${userId}/ban`,
    );
    return response.data.data;
};
