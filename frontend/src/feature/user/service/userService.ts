import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    type User,
    type EnrichedProfile,
    type RecommendedTitle,
    type PrivacySettings,
    type CommentSummary,
    type ViewHistoryItem,
} from '../type/user.types';

// ---------------------------------------------------------------------------
// Basic Profile
// ---------------------------------------------------------------------------

export const getUserProfile = async (userId: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(
        `${API_URLS.USERS}/${userId}`,
    );
    return response.data.data;
};

export const updateProfile = async (partial: Partial<User>): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(
        `${API_URLS.USERS}/me`,
        partial,
    );
    return response.data.data;
};

// ---------------------------------------------------------------------------
// Enriched Profile
// ---------------------------------------------------------------------------

export const getEnrichedProfile = async (userId: string): Promise<EnrichedProfile> => {
    const response = await api.get<ApiResponse<EnrichedProfile>>(
        `${API_URLS.USERS}/${userId}/profile`,
    );
    return response.data.data;
};

export const getMyEnrichedProfile = async (): Promise<EnrichedProfile> => {
    const response = await api.get<ApiResponse<EnrichedProfile>>(
        `${API_URLS.USERS}/me/profile`,
    );
    return response.data.data;
};

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export const addRecommendation = async (titleId: string): Promise<RecommendedTitle> => {
    const response = await api.post<ApiResponse<RecommendedTitle>>(
        `${API_URLS.USERS}/me/recommendations`,
        { titleId },
    );
    return response.data.data;
};

export const removeRecommendation = async (titleId: string): Promise<void> => {
    await api.delete(`${API_URLS.USERS}/me/recommendations/${titleId}`);
};

export const reorderRecommendations = async (titleIds: string[]): Promise<RecommendedTitle[]> => {
    const response = await api.put<ApiResponse<RecommendedTitle[]>>(
        `${API_URLS.USERS}/me/recommendations/order`,
        titleIds,
    );
    return response.data.data;
};

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

export const updatePrivacySettings = async (
    settings: Partial<PrivacySettings>,
): Promise<PrivacySettings> => {
    const response = await api.patch<ApiResponse<PrivacySettings>>(
        `${API_URLS.USERS}/me/privacy`,
        settings,
    );
    return response.data.data;
};

// ---------------------------------------------------------------------------
// User Comments & History (paginated)
// ---------------------------------------------------------------------------

export const getUserComments = async (
    userId: string,
    page = 0,
    size = 10,
): Promise<PageResponse<CommentSummary>> => {
    const response = await api.get<ApiResponse<PageResponse<CommentSummary>>>(
        `${API_URLS.USERS}/${userId}/comments`,
        { params: { page, size } },
    );
    return response.data.data;
};

export const getUserHistory = async (
    userId: string,
    page = 0,
    size = 10,
): Promise<PageResponse<ViewHistoryItem>> => {
    const response = await api.get<ApiResponse<PageResponse<ViewHistoryItem>>>(
        `${API_URLS.USERS}/${userId}/history`,
        { params: { page, size } },
    );
    return response.data.data;
};

// ---------------------------------------------------------------------------
// Record View (fire-and-forget)
// ---------------------------------------------------------------------------

export const recordView = async (titleId: string): Promise<void> => {
    await api.post(`${API_URLS.USERS}/me/history`, { titleId });
};
