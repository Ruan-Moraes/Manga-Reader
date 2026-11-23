import type { PageResponse } from '@shared/service/http';

import type { ChapterMetrics, ChapterMetricsFilter, ChapterMetricsSummaryRow, MetricsGranularity, SeriesPoint } from '../../model/admin/chapterMetrics.types';
import type { ChapterAnalyticsGateway } from '../../model/admin/chapterAnalyticsGateway.port';

import { createSeededRandom, hashString } from './seededRandom';
import type { ChapterStore } from './localStorageChapterStore';

/**
 * Métricas simuladas — gerador determinístico.
 *
 * A semente combina `chapterId` + filtros bucketizados: os mesmos filtros
 * produzem sempre os mesmos números (estáveis entre reloads), e filtros
 * diferentes produzem recortes diferentes, como um servidor real faria.
 */

const filterKey = (filter: ChapterMetricsFilter): string =>
    [filter.from ?? '', filter.to ?? '', filter.device ?? 'all', filter.platform ?? 'all', filter.titleId ?? '', filter.chapterId ?? ''].join('|');

/** Fator de recorte: filtros mais estreitos reduzem os volumes. */
const filterFactor = (filter: ChapterMetricsFilter): number => {
    let factor = 1;
    if (filter.device && filter.device !== 'all') factor *= 0.42;
    if (filter.platform && filter.platform !== 'all') factor *= 0.5;
    if (filter.from || filter.to) factor *= 0.6;
    return factor;
};

const buildMetrics = (chapterId: string, baseReads: number, filter: ChapterMetricsFilter): ChapterMetrics => {
    const rng = createSeededRandom(hashString(`${chapterId}::${filterKey(filter)}`));
    const factor = filterFactor(filter);
    const totalReads = Math.max(1, Math.round((baseReads || rng.int(500, 30_000)) * factor));
    const uniqueReaders = Math.round(totalReads * (0.55 + rng.next() * 0.3));
    const completionRate = 0.4 + rng.next() * 0.55;
    const abandonCount = Math.round(totalReads * (1 - completionRate));
    const deviceSplit = [0.5 + rng.next() * 0.2, 0.2 + rng.next() * 0.15];

    return {
        chapterId,
        totalReads,
        uniqueReaders,
        avgReadTimeSec: rng.int(180, 900),
        completionRate,
        avgReadPct: Math.min(1, completionRate + rng.next() * 0.15),
        abandonCount,
        avgAbandonPage: rng.int(2, 14),
        favoritesAfterRead: Math.round(totalReads * (0.01 + rng.next() * 0.05)),
        readsByDevice: {
            mobile: Math.round(totalReads * deviceSplit[0]),
            desktop: Math.round(totalReads * deviceSplit[1]),
            tablet: Math.max(0, totalReads - Math.round(totalReads * deviceSplit[0]) - Math.round(totalReads * deviceSplit[1])),
        },
        readsByPlatform: {
            web: Math.round(totalReads * (0.45 + rng.next() * 0.2)),
            android: Math.round(totalReads * (0.2 + rng.next() * 0.15)),
            ios: Math.round(totalReads * (0.08 + rng.next() * 0.12)),
        },
        vsPreviousChapter: rng.next() < 0.15 ? null : { reads: -0.3 + rng.next() * 0.6, completionRate: -0.15 + rng.next() * 0.3 },
        vsTitleAverage: { reads: -0.25 + rng.next() * 0.5, completionRate: -0.1 + rng.next() * 0.25 },
        firstReadAt: new Date(Date.UTC(2026, rng.int(0, 4), rng.int(1, 28))).toISOString(),
        lastReadAt: new Date(Date.UTC(2026, 5, rng.int(1, 30))).toISOString(),
        first24hReads: Math.round(totalReads * (0.1 + rng.next() * 0.25)),
        first7dReads: Math.round(totalReads * (0.35 + rng.next() * 0.35)),
    };
};

export const createLocalStorageChapterAnalyticsGateway = (store: ChapterStore): ChapterAnalyticsGateway => ({
    async getChapterMetrics(chapterId, filter) {
        await store.delay();
        const chapter = store.read().chapters.find(c => c.id === chapterId);
        return buildMetrics(chapterId, chapter?.reads ?? 0, filter);
    },

    async getOverview(filter, page, size) {
        await store.delay();
        const state = store.read();

        let chapters = state.chapters.filter(c => !c.deletedAt && c.status === 'published');
        if (filter.titleId) chapters = chapters.filter(c => c.titleId === filter.titleId);
        if (filter.chapterId) chapters = chapters.filter(c => c.id === filter.chapterId);

        const rows: ChapterMetricsSummaryRow[] = chapters
            .map(c => {
                const metrics = buildMetrics(c.id, c.reads, filter);
                return {
                    chapterId: c.id,
                    titleId: c.titleId,
                    titleName: c.titleName,
                    chapterNumber: c.number,
                    chapterTitle: c.title,
                    totalReads: metrics.totalReads,
                    uniqueReaders: metrics.uniqueReaders,
                    completionRate: metrics.completionRate,
                    avgReadTimeSec: metrics.avgReadTimeSec,
                };
            })
            .sort((a, b) => b.totalReads - a.totalReads);

        const totalElements = rows.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / size));
        const content = rows.slice(page * size, (page + 1) * size);

        return { content, page, size, totalElements, totalPages, last: page >= totalPages - 1 } satisfies PageResponse<ChapterMetricsSummaryRow>;
    },

    async getReadsSeries(filter, granularity: MetricsGranularity) {
        await store.delay();
        const rng = createSeededRandom(hashString(`series::${granularity}::${filterKey(filter)}`));
        const buckets = granularity === 'day' ? 30 : granularity === 'week' ? 12 : 6;
        const stepDays = granularity === 'day' ? 1 : granularity === 'week' ? 7 : 30;
        const end = filter.to ? new Date(filter.to) : new Date('2026-07-04T00:00:00Z');
        const factor = filterFactor(filter);

        const points: SeriesPoint[] = [];
        let level = rng.int(200, 2_000);
        for (let i = buckets - 1; i >= 0; i--) {
            const date = new Date(end.getTime() - i * stepDays * 86_400_000);
            level = Math.max(50, Math.round(level * (0.85 + rng.next() * 0.35)));
            points.push({ date: date.toISOString().slice(0, 10), value: Math.round(level * factor) });
        }
        return points;
    },
});
