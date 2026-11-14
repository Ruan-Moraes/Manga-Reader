import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';

import { createHttpReaderProgressGateway } from '../httpReaderProgressGateway';

describe('httpReaderProgressGateway', () => {
    it('envia o payload correto ao salvar progresso', async () => {
        let receivedBody: unknown = null;
        server.use(
            http.put('*/api/users/me/reading-progress', async ({ request }) => {
                receivedBody = await request.json();
                return HttpResponse.json({ data: null, success: true });
            }),
        );

        const gateway = createHttpReaderProgressGateway();
        await gateway.saveProgress('title-1', '5', 10, 20, false);

        expect(receivedBody).toEqual({
            titleId: 'title-1',
            chapterNumber: '5',
            currentPage: 10,
            totalPages: 20,
            completed: false,
        });
    });

    it('retorna o progresso mapeado quando existe', async () => {
        server.use(
            http.get('*/api/users/me/reading-progress/:titleId', () =>
                HttpResponse.json({
                    data: { titleId: 'title-1', chapterNumber: '5', currentPage: 10, totalPages: 20, completed: false, updatedAt: '2024-01-01T00:00:00Z' },
                    success: true,
                }),
            ),
        );

        const gateway = createHttpReaderProgressGateway();
        const result = await gateway.getProgress('title-1');

        expect(result).toEqual({ chapter: 5, page: 10 });
    });

    it('retorna null quando não há progresso salvo', async () => {
        server.use(http.get('*/api/users/me/reading-progress/:titleId', () => HttpResponse.json({ data: null, success: true })));

        const gateway = createHttpReaderProgressGateway();
        const result = await gateway.getProgress('title-1');

        expect(result).toBeNull();
    });

    it('propaga erro de rede ao salvar (chamador decide o tratamento)', async () => {
        server.use(http.put('*/api/users/me/reading-progress', () => HttpResponse.json({ success: false }, { status: 500 })));

        const gateway = createHttpReaderProgressGateway();

        await expect(gateway.saveProgress('title-1', '5', 10, 20, false)).rejects.toBeTruthy();
    });
});
