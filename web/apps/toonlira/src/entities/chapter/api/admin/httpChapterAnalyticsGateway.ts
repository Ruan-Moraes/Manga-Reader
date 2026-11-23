import type { ChapterAnalyticsGateway } from '../../model/admin/chapterAnalyticsGateway.port';
import type { ChapterMetrics } from '../../model/admin/chapterMetrics.types';
import type { ChapterAdminGateway } from '../../model/admin/chapterAdminGateway.port';
import { api, type ApiResponse } from '@shared/service/http';

const params = (filter: Parameters<ChapterAnalyticsGateway['getChapterMetrics']>[1]) => ({
    from: filter.from ? `${filter.from}T00:00:00Z` : undefined,
    to: filter.to ? `${filter.to}T23:59:59.999Z` : undefined,
    device: filter.device === 'all' ? undefined : filter.device,
    platform: filter.platform === 'all' ? undefined : filter.platform,
});

export const createHttpChapterAnalyticsGateway = (admin: ChapterAdminGateway): ChapterAnalyticsGateway => ({
    async getChapterMetrics(chapterId, filter) {
        const response = await api.get<ApiResponse<ChapterMetrics>>(`/api/admin/chapter-analytics/${chapterId}`, { params: params(filter) });
        return response.data.data;
    },
    async getOverview(filter, page, size) {
        const chapters = await admin.list({ page, size, titleId: filter.titleId, status: ['published'] });
        const metrics = await Promise.all(chapters.content.map(chapter =>
            api.get<ApiResponse<ChapterMetrics>>(`/api/admin/chapter-analytics/${chapter.id}`, { params: params(filter) })
                .then(response => response.data.data),
        ));
        return { ...chapters, content: chapters.content.map((chapter, index) => ({ chapterId: chapter.id, titleId: chapter.titleId,
            titleName: chapter.titleName, chapterNumber: chapter.number, chapterTitle: chapter.title,
            totalReads: metrics[index].totalReads, uniqueReaders: metrics[index].uniqueReaders,
            completionRate: metrics[index].completionRate, avgReadTimeSec: metrics[index].avgReadTimeSec })) };
    },
    async getReadsSeries(filter, granularity) {
        if (!filter.chapterId) return [];
        const response = await api.get<ApiResponse<Array<{ date: string; value: number }>>>(
            `/api/admin/chapter-analytics/${filter.chapterId}/series`, { params: { ...params(filter), granularity } },
        );
        return response.data.data;
    },
});
