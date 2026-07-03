import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type GroupSummary } from '@entities/group/@x/user';

/** Estado do follow devolvido por POST/DELETE — reconciliação otimista (DT-48). */
export type FollowStatus = {
    following: boolean;
    followersCount: number;
};

/** Card mínimo das listas de seguidores/seguindo. */
export type UserSummary = {
    id: string;
    name: string;
    username: string | null;
    photoUrl: string | null;
    verified: boolean;
};

export const followUser = async (userId: string): Promise<FollowStatus> => {
    const response = await api.post<ApiResponse<FollowStatus>>(`${API_URLS.USERS}/${userId}/follow`);

    return response.data.data;
};

export const unfollowUser = async (userId: string): Promise<FollowStatus> => {
    const response = await api.delete<ApiResponse<FollowStatus>>(`${API_URLS.USERS}/${userId}/follow`);

    return response.data.data;
};

export const getFollowers = async (userId: string, page = 0, size = 20): Promise<PageResponse<UserSummary>> => {
    const response = await api.get<ApiResponse<PageResponse<UserSummary>>>(`${API_URLS.USERS}/${userId}/followers`, { params: { page, size } });

    return response.data.data;
};

export const getFollowing = async (userId: string, page = 0, size = 20): Promise<PageResponse<UserSummary>> => {
    const response = await api.get<ApiResponse<PageResponse<UserSummary>>>(`${API_URLS.USERS}/${userId}/following`, { params: { page, size } });

    return response.data.data;
};

/** Grupos que o usuário segue/apoia (SUPPORTER). */
export const getFollowedGroups = async (userId: string): Promise<GroupSummary[]> => {
    const response = await api.get<ApiResponse<GroupSummary[]>>(`${API_URLS.USERS}/${userId}/followed-groups`);

    return response.data.data;
};
