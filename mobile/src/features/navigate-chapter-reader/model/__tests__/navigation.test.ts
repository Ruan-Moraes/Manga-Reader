import type { ChapterPage } from '@/entities/chapter';

import { buildReaderItems, clampLogicalPage, effectiveReaderMode, logicalItemIndex } from '../../index';

const pages = Array.from(
    { length: 5 },
    (_, index): ChapterPage => ({ id: `p${index + 1}`, order: index + 1, imageUrl: `${index}`, thumbnailUrl: `${index}-t`, width: 10, height: 20 }),
);

describe('MOB-FEAT-005/AC-002 reader navigation', () => {
    it.each([
        ['VERTICAL', 'LTR'],
        ['VERTICAL', 'RTL'],
        ['VERTICAL', 'WEBTOON'],
        ['PAGED', 'LTR'],
        ['PAGED', 'RTL'],
        ['PAGED', 'WEBTOON'],
        ['DOUBLE', 'LTR'],
        ['DOUBLE', 'RTL'],
        ['DOUBLE', 'WEBTOON'],
    ] as const)('preserves every identity exactly once for %s × %s', (mode, direction) => {
        const ids = buildReaderItems(pages, mode, direction)
            .flat()
            .map(page => page.id);
        expect(new Set(ids).size).toBe(pages.length);
        expect([...ids].sort()).toEqual(pages.map(page => page.id).sort());
        expect(direction === 'WEBTOON' ? effectiveReaderMode(mode, direction) : mode).toBe(direction === 'WEBTOON' ? 'VERTICAL' : mode);
    });

    it.each(['VERTICAL', 'PAGED'] as const)('keeps every page once in %s', mode => {
        expect(
            buildReaderItems(pages, mode, 'LTR')
                .flat()
                .map(page => page.id),
        ).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    });

    it('groups DOUBLE without repetition and preserves the odd final page', () => {
        expect(buildReaderItems(pages, 'DOUBLE', 'LTR').map(item => item.map(page => page.id))).toEqual([['p1', 'p2'], ['p3', 'p4'], ['p5']]);
        expect(buildReaderItems(pages, 'DOUBLE', 'RTL').map(item => item.map(page => page.id))).toEqual([['p2', 'p1'], ['p4', 'p3'], ['p5']]);
    });

    it('forces WEBTOON to vertical and preserves a logical page across regrouping', () => {
        expect(effectiveReaderMode('DOUBLE', 'WEBTOON')).toBe('VERTICAL');
        expect(logicalItemIndex(buildReaderItems(pages, 'DOUBLE', 'LTR'), 'p4')).toBe(1);
        expect(clampLogicalPage(99, 5)).toBe(5);
    });
});
