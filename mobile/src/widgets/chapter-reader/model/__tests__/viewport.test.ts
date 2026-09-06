import type { ChapterPage } from '@/entities/chapter';
import { darkTokens } from '@/shared/theme';

import { adjacentPages, pageAtOffset, pageOffset, readerBackgroundColor, verticalPageLayouts } from '../viewport';

const pages = Array.from(
    { length: 30 },
    (_, index): ChapterPage => ({ id: `${index + 1}`, order: index + 1, imageUrl: `${index + 1}`, thumbnailUrl: 't', width: 1, height: 1 }),
);

describe('MOB-FEAT-005/AC-008 reader viewport limits', () => {
    it('requests no adjacent images at preload 0 and caps radius at 10', () => {
        expect(adjacentPages(pages, 15, 0)).toHaveLength(0);
        expect(adjacentPages(pages, 15, 10)).toHaveLength(20);
        expect(new Set(adjacentPages(pages, 15, 10).map(page => page.id)).size).toBe(20);
    });

    it('calculates heterogeneous page geometry for fit, gaps and rotation without mounted images', () => {
        const input = [
            { ...pages[0], width: 800, height: 1000 },
            { ...pages[1], width: 400, height: 1600 },
        ];
        expect(verticalPageLayouts(input, 'WIDTH', 400, 800, 16)).toEqual([
            { id: '1', y: 0, height: 500 },
            { id: '2', y: 516, height: 1600 },
        ]);
        expect(verticalPageLayouts(input, 'WIDTH', 800, 400, 16)[1]).toEqual({ id: '2', y: 1016, height: 3200 });
        expect(verticalPageLayouts(input, 'HEIGHT', 400, 800, 0)[1]).toEqual({ id: '2', y: 800, height: 800 });
        expect(verticalPageLayouts(input, 'ORIGINAL', 400, 800, 32)[1]).toEqual({ id: '2', y: 1032, height: 1600 });
    });

    it('maps reader-only backgrounds deterministically', () => {
        expect(readerBackgroundColor('BLACK', darkTokens)).toBe(darkTokens.logoBg);
        expect(readerBackgroundColor('WHITE', darkTokens)).not.toBe(darkTokens.bg);
    });

    it('maps variable-height layouts and gaps by page identity instead of viewport height', () => {
        const layouts = [
            { id: 'p1', y: 0, height: 100 },
            { id: 'p2', y: 116, height: 240 },
            { id: 'p3', y: 372, height: 80 },
        ];
        expect(pageOffset(layouts, 'p2')).toBe(116);
        expect(pageAtOffset(layouts, 115)).toBe('p1');
        expect(pageAtOffset(layouts, 116)).toBe('p2');
        expect(pageAtOffset(layouts, 380)).toBe('p3');
    });
});
