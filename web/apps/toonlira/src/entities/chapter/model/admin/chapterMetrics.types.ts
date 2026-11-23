/**
 * Contratos de métricas de leitura de capítulos (analytics).
 * Alimentados pelos eventos e registros de leitura persistidos no backend.
 */

export type MetricsDevice = 'all' | 'mobile' | 'desktop' | 'tablet';
export type MetricsPlatform = 'all' | 'web' | 'android' | 'ios';
export type MetricsGranularity = 'day' | 'week' | 'month';

export type ChapterMetricsFilter = {
    /** ISO date (inclusive). */
    from?: string;
    /** ISO date (inclusive). */
    to?: string;
    device?: MetricsDevice;
    platform?: MetricsPlatform;
    titleId?: string;
    chapterId?: string;
};

export type SeriesPoint = {
    /** ISO date do bucket. */
    date: string;
    value: number;
};

/** Comparação percentual (-1..+∞): 0.15 = +15% em relação à referência. */
export type MetricsComparison = {
    reads: number;
    completionRate: number;
};

export type ChapterMetrics = {
    chapterId: string;
    totalReads: number;
    uniqueReaders: number;
    avgReadTimeSec: number;
    completionRate: number;
    avgReadPct: number;
    abandonCount: number;
    avgAbandonPage: number;
    favoritesAfterRead: number;
    readsByDevice: Record<Exclude<MetricsDevice, 'all'>, number>;
    readsByPlatform: Record<Exclude<MetricsPlatform, 'all'>, number>;
    /** vs capítulo anterior da mesma obra (null se for o primeiro). */
    vsPreviousChapter: MetricsComparison | null;
    /** vs média de todos os capítulos da obra. */
    vsTitleAverage: MetricsComparison;
    firstReadAt: string | null;
    lastReadAt: string | null;
    /** Desempenho nas primeiras 24h / 7 dias após a publicação. */
    first24hReads: number;
    first7dReads: number;
};

/** Linha da visão comparativa (tabela de overview do analytics). */
export type ChapterMetricsSummaryRow = {
    chapterId: string;
    titleId: string;
    titleName: string;
    chapterNumber: string;
    chapterTitle: string;
    totalReads: number;
    uniqueReaders: number;
    completionRate: number;
    avgReadTimeSec: number;
};
