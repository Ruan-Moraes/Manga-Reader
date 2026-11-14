import { describe, it, expect } from 'vitest';

import { createMemoryStorage } from '@/test/helpers/memoryStorage';

import { CHAPTER_STORE_KEY, createChapterStore } from '../localStorageChapterStore';
import { createLocalStorageChapterAdminGateway } from '../localStorageChapterAdminGateway';
import { createLocalStorageChapterPublicGateway } from '../localStorageChapterPublicGateway';

const setup = () => {
    const storage = createMemoryStorage();
    const store = createChapterStore({ latencyMs: 0, storage, seed: 11 });
    return {
        storage,
        publicGateway: createLocalStorageChapterPublicGateway(store),
        adminGateway: createLocalStorageChapterAdminGateway(store),
    };
};

describe('localStorageChapterPublicGateway', () => {
    it('NUNCA semeia: storage vazio retorna null (leitor cai no fallback)', async () => {
        const { publicGateway, storage } = setup();

        expect(await publicGateway.getReaderChapter('1', '1')).toBeNull();
        expect(storage.getItem(CHAPTER_STORE_KEY)).toBeNull();
    });

    it('capítulo published retorna com páginas ready ordenadas', async () => {
        const { publicGateway, adminGateway } = setup();
        const published = (await adminGateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];

        const reader = await publicGateway.getReaderChapter('1', published.number);

        expect(reader).not.toBeNull();
        expect(reader).not.toBe('blocked');
        if (reader && reader !== 'blocked') {
            expect(reader.pages.length).toBe(published.readyPagesCount);
            expect(reader.pages.map(p => p.order)).toEqual(reader.pages.map((_, i) => i + 1));
            expect(reader.pages[0].imageUrl).toContain('picsum.photos');
        }
    });

    it('hidden/unavailable/draft retornam blocked sem preview e o conteúdo com preview', async () => {
        const { publicGateway, adminGateway } = setup();
        await adminGateway.list({ page: 0, size: 1 }); // dispara o seed
        const draft = await adminGateway.create({ titleId: '1', title: 'Rascunho secreto', number: '900' });

        expect(await publicGateway.getReaderChapter('1', '900')).toBe('blocked');

        const preview = await publicGateway.getReaderChapter('1', '900', { includeUnpublished: true });
        expect(preview).not.toBe('blocked');
        if (preview && preview !== 'blocked') expect(preview.id).toBe(draft.id);
    });

    it('capítulo soft-deletado some do público', async () => {
        const { publicGateway, adminGateway } = setup();
        const published = (await adminGateway.list({ page: 0, size: 1, titleId: '2', status: ['published'] })).content[0];

        await adminGateway.softDelete(published.id);

        expect(await publicGateway.getReaderChapter('2', published.number)).toBeNull();
    });

    it('busca por número normalizado ("2.0" encontra o capítulo "2")', async () => {
        const { publicGateway, adminGateway } = setup();
        await adminGateway.list({ page: 0, size: 1 });

        const c2 = await publicGateway.getReaderChapter('1', '2.0');
        const direct = await publicGateway.getReaderChapter('1', '2');
        expect(c2).toEqual(direct);
    });
});
