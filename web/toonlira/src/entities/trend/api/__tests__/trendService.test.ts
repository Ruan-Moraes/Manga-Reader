import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import { getTrendingDashboard, getTrendingTitles } from '../trendService';

const item = {
    id: 'title-1',
    name: 'Berserk',
    genres: ['Seinen'],
    score: 120,
    growthPercent: 34,
    metrics: { reads: 120, libraryAdds: 20, reviews: 4, comments: 8, releases: 1 },
    growth: { reads: 42, libraryAdds: 30, reviews: 18, comments: 12, releases: 0 },
    calculatedAt: '2026-07-11T00:00:00Z',
};

describe('trendService', () => {
    it('sends the requested window, ranking and limit', async () => {
        let capturedUrl: URL | undefined;
        server.use(http.get(`*${API_URLS.TRENDING}`, ({ request }) => {
            capturedUrl = new URL(request.url);
            return HttpResponse.json({ data: [item], success: true });
        }));

        const result = await getTrendingTitles('MONTH', 'READS', 5);

        expect(result).toEqual([item]);
        expect(capturedUrl?.searchParams.get('window')).toBe('MONTH');
        expect(capturedUrl?.searchParams.get('ranking')).toBe('READS');
        expect(capturedUrl?.searchParams.get('limit')).toBe('5');
    });

    it('builds every dashboard leaderboard with one public contract', async () => {
        const rankings: string[] = [];
        server.use(http.get(`*${API_URLS.TRENDING}`, ({ request }) => {
            rankings.push(new URL(request.url).searchParams.get('ranking') ?? '');
            return HttpResponse.json({ data: [item], success: true });
        }));

        const result = await getTrendingDashboard('WEEK');

        expect(result.momentum).toEqual([item]);
        expect(rankings).toEqual(expect.arrayContaining(['SCORE', 'READS', 'REVIEWS', 'LIBRARY_ADDS']));
    });

    it('propagates API errors', async () => {
        server.use(http.get(`*${API_URLS.TRENDING}`, () => new HttpResponse(null, { status: 500 })));

        await expect(getTrendingTitles('DAY')).rejects.toThrow();
    });
});
