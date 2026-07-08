import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { chapterAnalyticsGateway, type ChapterMetricsFilter, type MetricsGranularity } from '@entities/chapter';

type ChapterAnalyticsOptions = {
    /** Desliga a query de overview (painel por capítulo não a consome). */
    overview?: boolean;
};

/** Métricas de capítulos com filtros aplicados "no servidor" (gateway). */
const useChapterAnalytics = (initialFilter: ChapterMetricsFilter = {}, options: ChapterAnalyticsOptions = {}) => {
    const [filter, setFilterState] = useState<ChapterMetricsFilter>(initialFilter);
    const [granularity, setGranularity] = useState<MetricsGranularity>('day');
    const [page, setPage] = useState(0);

    const metricsQuery = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTER_METRICS, filter.chapterId, filter],
        queryFn: () => chapterAnalyticsGateway.getChapterMetrics(filter.chapterId!, filter),
        enabled: !!filter.chapterId,
    });

    const overviewQuery = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTER_METRICS_OVERVIEW, filter, page],
        queryFn: () => chapterAnalyticsGateway.getOverview(filter, page, 10),
        placeholderData: keepPreviousData,
        enabled: options.overview !== false,
    });

    const seriesQuery = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTER_READS_SERIES, filter, granularity],
        queryFn: () => chapterAnalyticsGateway.getReadsSeries(filter, granularity),
    });

    const setFilter = (next: ChapterMetricsFilter) => {
        setFilterState(next);
        setPage(0);
    };

    return {
        filter,
        setFilter,
        granularity,
        setGranularity,
        page,
        setPage,
        metrics: metricsQuery.data ?? null,
        overview: overviewQuery.data ?? null,
        series: seriesQuery.data ?? [],
        isLoading: overviewQuery.isLoading || seriesQuery.isLoading,
        isError: overviewQuery.isError || seriesQuery.isError,
        isLoadingMetrics: metricsQuery.isLoading,
    };
};

export default useChapterAnalytics;
