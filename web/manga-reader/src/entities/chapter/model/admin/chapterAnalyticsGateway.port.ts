import type { PageResponse } from '@shared/service/http';

import type { ChapterMetrics, ChapterMetricsFilter, ChapterMetricsSummaryRow, MetricsGranularity, SeriesPoint } from './chapterMetrics.types';

/**
 * Port de métricas de leitura (analytics).
 *
 * Implementação atual: gerador determinístico fake (mesmos filtros ⇒ mesmos
 * números, estável entre reloads). Filtros são aplicados dentro do gateway,
 * nunca no componente.
 */
export interface ChapterAnalyticsGateway {
    getChapterMetrics(chapterId: string, filter: ChapterMetricsFilter): Promise<ChapterMetrics>;
    getOverview(filter: ChapterMetricsFilter, page: number, size: number): Promise<PageResponse<ChapterMetricsSummaryRow>>;
    getReadsSeries(filter: ChapterMetricsFilter, granularity: MetricsGranularity): Promise<SeriesPoint[]>;
}
