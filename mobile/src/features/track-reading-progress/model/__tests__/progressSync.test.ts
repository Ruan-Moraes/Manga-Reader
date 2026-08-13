import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/src/shared/api';

import { createProgressSnapshot, isReadingProgressValidForChapter, ProgressSynchronizer, resolveResumeChoice } from '../../index';

describe('MOB-FEAT-005/AC-005/006/007/008 progress tracking', () => {
    const apiMock = new AxiosMockAdapter(api);
    afterEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('creates bounded 1-based payloads and completes only the known final page', () => {
        expect(createProgressSnapshot('t', '7.5', 99, 10, true)).toEqual({
            titleId: 't',
            chapterNumber: '7.5',
            currentPage: 10,
            totalPages: 10,
            completed: true,
        });
        expect(createProgressSnapshot('t', '2', 9, 10, true)?.completed).toBe(false);
        expect(createProgressSnapshot('t', '2', 10, 10, false)?.completed).toBe(false);
        expect(createProgressSnapshot('t', '2', 1, 0, true)).toBeNull();
    });

    it('never writes for guest and keeps the latest failed payload pending for retry', async () => {
        const sync = new ProgressSynchronizer();
        const first = createProgressSnapshot('t', '7.5', 2, 10, true)!;
        sync.activate(null);
        sync.queue(first);
        await sync.flush();
        expect(apiMock.history.put).toHaveLength(0);

        sync.activate(1);
        sync.queue(first);
        apiMock.onPut('/users/me/reading-progress').replyOnce(503);
        await sync.flush();
        expect(sync.getState().status).toBe('error');
        sync.queue({ ...first, currentPage: 4 });
        apiMock.onPut('/users/me/reading-progress').replyOnce(200);
        await sync.retry();
        expect(JSON.parse(apiMock.history.put[1].data as string)).toMatchObject({ chapterNumber: '7.5', currentPage: 4 });
        expect(sync.getState().status).toBe('idle');
    });

    it('drops account memory on identity change and resolves divergent resume explicitly', async () => {
        const sync = new ProgressSynchronizer();
        sync.activate(1);
        sync.queue(createProgressSnapshot('t', '2', 2, 10, true)!);
        sync.activate(2);
        await sync.flush();
        expect(apiMock.history.put).toHaveLength(0);
        expect(resolveResumeChoice('1', { titleId: 't', chapterNumber: '2', currentPage: 3, totalPages: 10, completed: false }, 't').kind).toBe('choose');
        expect(resolveResumeChoice('2', { titleId: 't', chapterNumber: '2', currentPage: 3, totalPages: 10, completed: false }, 't')).toMatchObject({
            kind: 'requested',
            currentPage: 3,
        });
    });

    it('flushes the latest pending progress before deactivation', async () => {
        const sync = new ProgressSynchronizer();
        sync.activate(1);
        sync.queue(createProgressSnapshot('t', '2', 4, 10, true)!);
        apiMock.onPut('/users/me/reading-progress').reply(200);

        await sync.deactivate();

        expect(JSON.parse(apiMock.history.put[0].data as string)).toMatchObject({ chapterNumber: '2', currentPage: 4 });
        expect(sync.getState().status).toBe('idle');
    });

    it('rejects structurally valid remote progress that exceeds or disagrees with the actual chapter', () => {
        const progress = { titleId: 't', chapterNumber: '7.5', currentPage: 3, totalPages: 3, completed: true };
        expect(isReadingProgressValidForChapter(progress, '7.5', 2)).toBe(false);
        expect(isReadingProgressValidForChapter({ ...progress, currentPage: 2, totalPages: 2 }, '7.5', 2)).toBe(true);
        expect(isReadingProgressValidForChapter({ ...progress, chapterNumber: '8' }, '7.5', 3)).toBe(false);
    });
});
