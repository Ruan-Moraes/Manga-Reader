import AxiosMockAdapter from 'axios-mock-adapter';

import { api } from '@/src/shared/api';

import { chapterQueryKeys, chapterReaderQueryKey, chapterReaderQueryOptions, getChapterForReader } from '../../index';

describe('MOB-FEAT-005/AC-001 public chapter reader contract', () => {
    const apiMock = new AxiosMockAdapter(api);

    afterEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('usa título/capítulo codificados, aceita cancelamento e normaliza o envelope', async () => {
        apiMock.onGet('/titles/title%2Fwith%2Fslash/chapters/7%20special/reader').reply(config => {
            expect(config.signal).toBeDefined();
            return [
                200,
                {
                    data: {
                        id: 'chapter-7',
                        titleId: 'title/with/slash',
                        number: '7 special',
                        title: 'Chapter 7',
                        status: 'PUBLISHED',
                        pages: [
                            {
                                id: 'page-2',
                                order: 2,
                                imageUrl: 'https://cdn.example.com/2.jpg',
                                thumbnailUrl: 'https://cdn.example.com/2-thumb.jpg',
                                width: 800,
                                height: 1200,
                            },
                            {
                                id: 'page-1',
                                order: 1,
                                imageUrl: 'https://cdn.example.com/1.jpg',
                                thumbnailUrl: 'https://cdn.example.com/1-thumb.jpg',
                                width: 800,
                                height: 1200,
                                internalField: true,
                            },
                        ],
                    },
                    success: true,
                },
            ];
        });

        const result = await getChapterForReader('title/with/slash', '7 special', new AbortController().signal);

        expect(result?.pages.map(({ id }) => id)).toEqual(['page-1', 'page-2']);
        expect(result?.pages[0]).toEqual({
            id: 'page-1',
            order: 1,
            imageUrl: 'https://cdn.example.com/1.jpg',
            thumbnailUrl: 'https://cdn.example.com/1-thumb.jpg',
            width: 800,
            height: 1200,
        });
    });

    it('mantém capítulo disponível com lista vazia quando nenhuma página é válida', async () => {
        apiMock.onGet('/titles/title-1/chapters/1/reader').reply(200, {
            data: {
                id: 'chapter-1',
                titleId: 'title-1',
                number: '1',
                title: 'Chapter 1',
                status: 'PUBLISHED',
                pages: [{ id: 'page-1', order: 1, imageUrl: null }],
            },
            success: true,
        });

        await expect(getChapterForReader('title-1', '1')).resolves.toMatchObject({ pages: [] });
        expect(apiMock.history.get.map(({ url }) => url)).toEqual(['/titles/title-1/chapters/1/reader']);
        expect(apiMock.history.get.some(({ url }) => url?.includes('/users/me/'))).toBe(false);
    });

    it('gera chaves públicas específicas sem identidade de sessão', () => {
        expect(chapterQueryKeys.all).toEqual(['chapter']);
        expect(chapterQueryKeys.reader('title-1', '7')).toEqual(['chapter', 'reader', 'title-1', '7']);
        expect(chapterReaderQueryKey('title-1', '7')).toEqual(['chapter', 'reader', 'title-1', '7']);
        expect(chapterReaderQueryOptions('title-1', '7').meta).toEqual({ localeDependent: true });
    });
});
