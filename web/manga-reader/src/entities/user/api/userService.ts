import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type User, type EnrichedProfile, type RecommendedTitle, type PrivacySettings, type CommentSummary, type ViewHistoryItem } from '@entities/user';
import { type UserSettings } from '@entities/user';

export type ContentLocales = {
    contentLocales: string[];
};

export const getUserProfile = async (userId: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`${API_URLS.USERS}/${userId}`);

    return response.data.data;
};

export type UpdateProfilePayload = Partial<{
    name: string;
    username: string;
    bio: string;
    photoUrl: string;
    bannerUrl: string;
    socialLinks: { platform: string; url: string }[];
}>;

export const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`${API_URLS.USERS}/me`, payload);

    return response.data.data;
};

export type FavoriteGenres = {
    favoriteGenres: string[];
};

export const getFavoriteGenres = async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<FavoriteGenres>>(`${API_URLS.USERS}/me/favorite-genres`);

    return response.data.data.favoriteGenres;
};

export const updateFavoriteGenres = async (favoriteGenres: string[]): Promise<string[]> => {
    const response = await api.patch<ApiResponse<FavoriteGenres>>(`${API_URLS.USERS}/me/favorite-genres`, { favoriteGenres });

    return response.data.data.favoriteGenres;
};

export const getEnrichedProfile = async (userId: string): Promise<EnrichedProfile> => {
    const response = await api.get<ApiResponse<EnrichedProfile>>(`${API_URLS.USERS}/${userId}/profile`);

    return response.data.data;
};

export const getMyEnrichedProfile = async (): Promise<EnrichedProfile> => {
    const response = await api.get<ApiResponse<EnrichedProfile>>(`${API_URLS.USERS}/me/profile`);

    return response.data.data;
};

export const addRecommendation = async (titleId: string): Promise<RecommendedTitle> => {
    const response = await api.post<ApiResponse<RecommendedTitle>>(`${API_URLS.USERS}/me/recommendations`, { titleId });

    return response.data.data;
};

export const removeRecommendation = async (titleId: string): Promise<void> => {
    await api.delete(`${API_URLS.USERS}/me/recommendations/${titleId}`);
};

export const reorderRecommendations = async (titleIds: string[]): Promise<RecommendedTitle[]> => {
    const response = await api.put<ApiResponse<RecommendedTitle[]>>(`${API_URLS.USERS}/me/recommendations/order`, titleIds);

    return response.data.data;
};

export const updatePrivacySettings = async (settings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    const response = await api.patch<ApiResponse<PrivacySettings>>(`${API_URLS.USERS}/me/privacy`, settings);

    return response.data.data;
};

export type UserGroupItem = {
    id: string;
    name: string;
    username: string;
    logo?: string | null;
    role?: string | null;
    memberCount: number;
};

export type UserGroups = {
    linked: UserGroupItem[];
    available: UserGroupItem[];
};

export const getMyGroups = async (): Promise<UserGroups> => {
    const response = await api.get<ApiResponse<UserGroups>>(`${API_URLS.USERS}/me/groups`);

    return response.data.data;
};

export const joinGroup = async (groupId: string): Promise<void> => {
    await api.post(`${API_URLS.GROUPS}/${groupId}/join`);
};

export const leaveGroup = async (groupId: string): Promise<void> => {
    await api.delete(`${API_URLS.GROUPS}/${groupId}/leave`);
};

export const deleteMyAccount = async (): Promise<void> => {
    await api.delete(`${API_URLS.USERS}/me`);
};

export const getUserComments = async (userId: string, page = 0, size = 10): Promise<PageResponse<CommentSummary>> => {
    const response = await api.get<ApiResponse<PageResponse<CommentSummary>>>(`${API_URLS.USERS}/${userId}/comments`, { params: { page, size } });

    return response.data.data;
};

export const getUserHistory = async (userId: string, page = 0, size = 10): Promise<PageResponse<ViewHistoryItem>> => {
    const response = await api.get<ApiResponse<PageResponse<ViewHistoryItem>>>(`${API_URLS.USERS}/${userId}/history`, { params: { page, size } });

    return response.data.data;
};

export const recordView = async (titleId: string): Promise<void> => {
    await api.post(`${API_URLS.USERS}/me/history`, { titleId });
};

export const getMyContentLocales = async (): Promise<ContentLocales> => {
    const response = await api.get<ApiResponse<ContentLocales>>(`${API_URLS.USERS}/me/content-locales`);

    return response.data.data;
};

export const updateMyContentLocales = async (payload: ContentLocales): Promise<ContentLocales> => {
    const response = await api.patch<ApiResponse<ContentLocales>>(`${API_URLS.USERS}/me/content-locales`, payload);

    return response.data.data;
};

export const getMySettings = async (): Promise<UserSettings> => {
    const response = await api.get<ApiResponse<UserSettings>>(`${API_URLS.USERS}/me/settings`);

    return response.data.data;
};

export const updateMySettings = async (payload: UserSettings): Promise<UserSettings> => {
    const response = await api.patch<ApiResponse<UserSettings>>(`${API_URLS.USERS}/me/settings`, payload);

    return response.data.data;
};
