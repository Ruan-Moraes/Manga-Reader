import type { ChapterPage } from '@/src/entities/chapter';
import { darkTokens } from '@/src/shared/theme';

import { adjacentPages, pageAtOffset, pageOffset, readerBackgroundColor } from '../viewport';

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
