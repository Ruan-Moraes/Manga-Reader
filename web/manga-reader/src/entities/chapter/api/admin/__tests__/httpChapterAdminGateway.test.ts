import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';

import { createHttpChapterAdminGateway } from '../httpChapterAdminGateway';

describe('httpChapterAdminGateway', () => {
    it('envia a reordenação inteira em uma única operação atômica', async () => {
        let requests = 0;
        let receivedBody: unknown;
        server.use(
            http.post('*/api/admin/chapters/reorder', async ({ request }) => {
                requests += 1;
                receivedBody = await request.json();
                return new HttpResponse(null, { status: 204 });
            }),
        );

        await createHttpChapterAdminGateway().reorderChapters(
            'title-1',
            ['chapter-2', 'chapter-1'],
        );

        expect(requests).toBe(1);
        expect(receivedBody).toEqual({
            titleId: 'title-1',
            orderedIds: ['chapter-2', 'chapter-1'],
        });
    });

    it('delega a duplicação ao backend para preservar a operação de domínio', async () => {
        let requested = false;
        server.use(
            http.post('*/api/admin/chapters/chapter-1/duplicate', () => {
                requested = true;
                return HttpResponse.json({
                    success: true,
                    data: { id: 'copy', titleId: 'title-1', title: 'Capítulo', number: '2', status: 'DRAFT' },
                });
            }),
        );

        const copy = await createHttpChapterAdminGateway().duplicate('chapter-1');

        expect(requested).toBe(true);
        expect(copy).toMatchObject({ id: 'copy', status: 'draft' });
    });
});
