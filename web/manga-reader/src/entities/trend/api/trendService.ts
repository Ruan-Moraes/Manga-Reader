import { API_URLS } from '@shared/constant/API_URLS';
import { api, type ApiResponse } from '@shared/service/http';

import type { TrendingDashboard, TrendingTitle, TrendRanking, TrendWindow } from '../model/trend.types';

export const getTrendingTitles = async (window: TrendWindow, ranking: TrendRanking = 'SCORE', limit = 30): Promise<TrendingTitle[]> => {
    const response = await api.get<ApiResponse<TrendingTitle[]>>(API_URLS.TRENDING, { params: { window, ranking, limit } });
    return response.data.data;
};

export const getTrendingDashboard = async (window: TrendWindow): Promise<TrendingDashboard> => {
    const [momentum, mostRead, mostReviewed, mostSaved] = await Promise.all([
        getTrendingTitles(window, 'SCORE', 12),
        getTrendingTitles(window, 'READS', 5),
        getTrendingTitles(window, 'REVIEWS', 5),
        getTrendingTitles(window, 'LIBRARY_ADDS', 5),
    ]);
    return { momentum, mostRead, mostReviewed, mostSaved };
};
