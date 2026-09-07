import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type GroupStatus, type Group, type GroupSummary } from '../model/group.types';
import type { RelatedTitle } from '@entities/manga/@x/group';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getGroups = async (page = 0, size = 20, search?: string): Promise<PageResponse<Group>> => {
    const response = await api.get<ApiResponse<PageResponse<Group>>>(API_URLS.GROUPS, {
        params: { page, size, ...(search ? { search } : {}) },
    });

    return response.data.data;
};

export const getGroupById = async (groupId: string): Promise<Group> => {
    const response = await api.get<ApiResponse<Group>>(`${API_URLS.GROUPS}/${groupId}`);

    return response.data.data;
};

export const getGroupWorks = async (
    groupId: string,
    page: number,
    size: number,
    signal?: AbortSignal,
): Promise<PageResponse<RelatedTitle>> => {
    const response = await api.get<ApiResponse<PageResponse<RelatedTitle>>>(`${API_URLS.GROUPS}/${groupId}/works`, {
        params: { page, size },
        signal,
    });
    return response.data.data;
};

export const getGroupsByTitleId = async (titleId: string, page = 0, size = 20): Promise<PageResponse<GroupSummary>> => {
    const response = await api.get<ApiResponse<PageResponse<GroupSummary>>>(`${API_URLS.GROUPS}/title/${titleId}`, { params: { page, size } });

    return response.data.data;
};

export const getMemberById = async (memberId: string) => {
    const response = await api.get<ApiResponse<unknown>>(`${API_URLS.GROUPS}/members/${memberId}`);

    return response.data.data;
};

export const supportGroup = async (groupId: string): Promise<Group> => {
    const response = await api.post<ApiResponse<Group>>(`${API_URLS.GROUPS}/${groupId}/support`);

    return response.data.data;
};

export const unsupportGroup = async (groupId: string): Promise<Group> => {
    const response = await api.delete<ApiResponse<Group>>(`${API_URLS.GROUPS}/${groupId}/support`);

    return response.data.data;
};

export const getGroupStatusLabelKey = (status: GroupStatus): string => {
    if (status === 'active') return 'status.active';
    if (status === 'inactive') return 'status.inactive';
    return 'status.hiatus';
};
