import type { PageResponse } from '@shared/service/http';

import type { ChapterMetrics, ChapterMetricsFilter, ChapterMetricsSummaryRow, MetricsGranularity, SeriesPoint } from './chapterMetrics.types';

/**
 * Port de métricas de leitura (analytics).
 *
 * A implementação HTTP envia os filtros ao backend; componentes não calculam
 * métricas localmente.
 */
export interface ChapterAnalyticsGateway {
    getChapterMetrics(chapterId: string, filter: ChapterMetricsFilter): Promise<ChapterMetrics>;
    getOverview(filter: ChapterMetricsFilter, page: number, size: number): Promise<PageResponse<ChapterMetricsSummaryRow>>;
    getReadsSeries(filter: ChapterMetricsFilter, granularity: MetricsGranularity): Promise<SeriesPoint[]>;
}
