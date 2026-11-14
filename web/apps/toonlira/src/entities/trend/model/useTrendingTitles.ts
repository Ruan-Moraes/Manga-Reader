import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getTrendingDashboard, getTrendingTitles } from '../api/trendService';
import type { TrendWindow } from './trend.types';

export const useTrendingTitles = (window: TrendWindow) => useQuery({
    queryKey: [QUERY_KEYS.TRENDING, window, 'SCORE', 30],
    queryFn: () => getTrendingTitles(window),
    staleTime: 1000 * 60 * 60,
});

export const useTrendingDashboard = (window: TrendWindow) => useQuery({
    queryKey: [QUERY_KEYS.TRENDING_DASHBOARD, window],
    queryFn: () => getTrendingDashboard(window),
    staleTime: 1000 * 60 * 60,
});
