import { getImageVariantCapabilities, mapReaderChapter, normalizeChapterPages } from '../../index';

const page = (id: string, order: number, overrides: Record<string, unknown> = {}) => ({
    id,
    order,
    imageUrl: `https://cdn.example.com/${id}.jpg`,
    thumbnailUrl: `https://cdn.example.com/${id}-thumb.jpg`,
    width: 800,
    height: 1200,
    ...overrides,
});

describe('MOB-FEAT-005/AC-001 chapter mapper', () => {
    it('remove páginas inválidas e repetidas e usa ordem numérica determinística', () => {
        const result = normalizeChapterPages([
            page('page-3', 3),
            page('page-1', 1),
            page('page-2-b', 2),
            page('page-2-a', 2),
            page('page-1', 9),
            page('missing-image', 4, { imageUrl: '' }),
            page('bad-order', 0),
            page('bad-size', 5, { height: null }),
            null,
        ]);

        expect(result.map(({ id, order }) => [id, order])).toEqual([
            ['page-1', 1],
            ['page-2-a', 2],
            ['page-2-b', 2],
            ['page-3', 3],
        ]);
    });

    it('mapeia somente o contrato público e preserva capítulo sem páginas válidas', () => {
        const result = mapReaderChapter({
            id: 'chapter-1',
            titleId: 'title-1',
            number: '7.5',
            title: '',
            status: 'PUBLISHED',
            pages: [page('invalid', 1, { thumbnailUrl: undefined })],
            privateDraftNotes: 'must-not-leak',
        });

        expect(result).toEqual({
            id: 'chapter-1',
            titleId: 'title-1',
            number: '7.5',
            title: '',
            status: 'PUBLISHED',
            pages: [],
        });
        expect(mapReaderChapter({ id: '', titleId: 'title-1', number: '1', title: '', status: 'PUBLISHED', pages: [] })).toBeNull();
    });
});

describe('MOB-FEAT-005/AC-004 image capabilities', () => {
    it('não transforma thumbnail em LOW/MEDIUM/HIGH selecionáveis', () => {
        const chapter = mapReaderChapter({
            id: 'chapter-1',
            titleId: 'title-1',
            number: '1',
            title: 'Chapter 1',
            status: 'PUBLISHED',
            pages: [page('page-1', 1)],
        })!;

        expect(getImageVariantCapabilities(chapter.pages)).toEqual({ low: false, medium: false, high: false });
    });
});
