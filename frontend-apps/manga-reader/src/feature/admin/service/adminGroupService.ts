import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import type {
    AdminGroup,
    ChangeGroupMemberRoleRequest,
} from '../type/admin.types';

export const getAdminGroups = async (
    page = 0,
    size = 20,
    search?: string,
    sort = 'platformJoinedAt',
    direction = 'desc',
): Promise<PageResponse<AdminGroup>> => {
    const response = await api.get<ApiResponse<PageResponse<AdminGroup>>>(
        API_URLS.ADMIN_GROUPS,
        { params: { page, size, search, sort, direction } },
    );
    return response.data.data;
};

export const getAdminGroupDetail = async (
    groupId: string,
): Promise<AdminGroup> => {
    const response = await api.get<ApiResponse<AdminGroup>>(
        `${API_URLS.ADMIN_GROUPS}/${groupId}`,
    );
    return response.data.data;
};

export const changeGroupMemberRole = async (
    groupId: string,
    userId: string,
    data: ChangeGroupMemberRoleRequest,
): Promise<AdminGroup> => {
    const response = await api.patch<ApiResponse<AdminGroup>>(
        `${API_URLS.ADMIN_GROUPS}/${groupId}/members/${userId}/role`,
        data,
    );
    return response.data.data;
};

export const removeGroupMember = async (
    groupId: string,
    userId: string,
): Promise<AdminGroup> => {
    const response = await api.delete<ApiResponse<AdminGroup>>(
        `${API_URLS.ADMIN_GROUPS}/${groupId}/members/${userId}`,
    );
    return response.data.data;
};
