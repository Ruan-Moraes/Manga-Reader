import { describe, it, expect } from 'vitest';

import { createMemoryStorage } from '@/test/helpers/memoryStorage';

import { createChapterStore } from '../localStorageChapterStore';
import { createLocalStorageChapterAdminGateway } from '../localStorageChapterAdminGateway';
import { createLocalStorageChapterAnalyticsGateway } from '../localStorageChapterAnalyticsGateway';

const setup = () => {
    const store = createChapterStore({ latencyMs: 0, storage: createMemoryStorage(), seed: 99 });
    return {
        analytics: createLocalStorageChapterAnalyticsGateway(store),
        admin: createLocalStorageChapterAdminGateway(store),
    };
};

describe('localStorageChapterAnalyticsGateway', () => {
    it('é determinístico: mesmo capítulo + mesmos filtros ⇒ mesmas métricas', async () => {
        const { analytics, admin } = setup();
        const chapter = (await admin.list({ page: 0, size: 1, status: ['published'] })).content[0];

        const a = await analytics.getChapterMetrics(chapter.id, { device: 'mobile' });
        const b = await analytics.getChapterMetrics(chapter.id, { device: 'mobile' });

        expect(a).toEqual(b);
        expect(a.totalReads).toBeGreaterThan(0);
        expect(a.completionRate).toBeGreaterThan(0);
        expect(a.completionRate).toBeLessThanOrEqual(1);
    });

    it('filtros diferentes produzem recortes diferentes e menores', async () => {
        const { analytics, admin } = setup();
        const chapter = (await admin.list({ page: 0, size: 1, status: ['published'] })).content[0];

        const all = await analytics.getChapterMetrics(chapter.id, {});
        const mobile = await analytics.getChapterMetrics(chapter.id, { device: 'mobile' });

        expect(mobile.totalReads).not.toBe(all.totalReads);
        expect(mobile.totalReads).toBeLessThan(all.totalReads);
    });

    it('overview pagina e traz só capítulos publicados, com filtro por obra', async () => {
        const { analytics, admin } = setup();
        await admin.list({ page: 0, size: 1 }); // dispara o seed

        const page = await analytics.getOverview({ titleId: '1' }, 0, 5);

        expect(page.content.length).toBeLessThanOrEqual(5);
        expect(page.content.every(r => r.titleId === '1')).toBe(true);
        expect(page.totalElements).toBeGreaterThan(0);
    });

    it('série temporal respeita a granularidade e é estável', async () => {
        const { analytics } = setup();

        const daily = await analytics.getReadsSeries({ titleId: '1' }, 'day');
        const dailyAgain = await analytics.getReadsSeries({ titleId: '1' }, 'day');
        const monthly = await analytics.getReadsSeries({ titleId: '1' }, 'month');

        expect(daily).toEqual(dailyAgain);
        expect(daily.length).toBe(30);
        expect(monthly.length).toBe(6);
        expect(daily.every(p => p.value >= 0)).toBe(true);
    });
});
