import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/src/shared/api';

import { getReadingProgress, readingProgressQueryKeys, subscribeReadingProgressDiagnostics } from '../../index';

describe('MOB-FEAT-005/AC-006 reading progress GET', () => {
    const apiMock = new AxiosMockAdapter(api);
    afterEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('maps the private endpoint and forwards cancellation', async () => {
        apiMock.onGet('/users/me/reading-progress/title%2F1').reply(config => {
            expect(config.signal).toBeDefined();
            return [200, { data: { titleId: 'title/1', chapterNumber: '7.5', currentPage: 3, totalPages: 8, completed: false } }];
        });
        await expect(getReadingProgress('title/1', new AbortController().signal)).resolves.toMatchObject({ chapterNumber: '7.5', currentPage: 3 });
    });

    it('mantém as chaves de progresso dentro da entity proprietária', () => {
        expect(readingProgressQueryKeys.all).toEqual(['reading-progress']);
        expect(readingProgressQueryKeys.byTitle(3, 'title-1')).toEqual(['reading-progress', 3, 'title-1']);
    });

    it('reports invalid private progress and falls back to no resume data', async () => {
        const diagnostic = jest.fn();
        const unsubscribe = subscribeReadingProgressDiagnostics(diagnostic);
        apiMock
            .onGet('/users/me/reading-progress/title-1')
            .reply(200, { data: { titleId: 'title-1', chapterNumber: '1', currentPage: 99, totalPages: 2, completed: false } });

        await expect(getReadingProgress('title-1')).resolves.toBeNull();
        expect(diagnostic).toHaveBeenCalledWith({ code: 'INVALID_READING_PROGRESS', titleId: 'title-1' });
        unsubscribe();
    });
});
