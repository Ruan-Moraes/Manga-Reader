import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import { darkHighContrastTokens, darkTokens, lightHighContrastTokens, lightTokens } from '@/shared/theme';

import { dominantVisibleItem, fittedImageSize, groupedImageItems, overlayBox, restoreLocationById, verticalItemLayouts } from '../contentReader';

const items = [
    { id: 'p1', primaryUri: 'one', width: 800, height: 1200 },
    { id: 'p2', primaryUri: 'two', width: 1000, height: 2000 },
    { id: 'p3', primaryUri: 'three', width: 800, height: 800 },
];

describe('MOB-FEAT-051 reader model', () => {
    it('keeps reader foregrounds readable on their themed surfaces', () => {
        const luminance = (hex: string) => {
            const channels = hex
                .slice(1)
                .match(/../g)!
                .map(channel => {
                    const value = parseInt(channel, 16) / 255;
                    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        for (const tokens of [darkTokens, lightTokens, darkHighContrastTokens, lightHighContrastTokens]) {
            for (const foreground of [tokens.text, tokens.accentText]) {
                const values = [luminance(foreground), luminance(tokens.surface)].sort((a, b) => b - a);
                expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
            }
        }
    });
    it('applies fit without cropping and avoids upscaling original pixels', () => {
        expect(fittedImageSize(items[0], 400, 300, 'WIDTH')).toEqual({ width: 400, height: 600 });
        expect(fittedImageSize(items[0], 400, 300, 'HEIGHT')).toEqual({ width: 200, height: 300 });
        expect(fittedImageSize({ width: 100, height: 100 }, 400, 600, 'ORIGINAL')).toEqual({ width: 100, height: 100 });
    });

    it('rejects non-finite geometry and clamps malformed restoration indexes', () => {
        expect(restoreLocationById(['p1'], { itemId: 'missing', index: NaN })).toEqual({ itemId: 'p1', index: 0 });
        expect(overlayBox([{ index: 0, x: NaN, y: 0 }])).toBeNull();
    });
    it('preserves order, exact viewport width ratio and zero-gap continuity', () => {
        expect(verticalItemLayouts(items, 400, 0)).toEqual([
            { id: 'p1', y: 0, height: 600 },
            { id: 'p2', y: 600, height: 800 },
            { id: 'p3', y: 1400, height: 400 },
        ]);
    });

    it('selects the largest visible intersection and the lower index on a tie', () => {
        const layouts = verticalItemLayouts(items.slice(0, 2), 400, 0);
        expect(dominantVisibleItem(layouts, 500, 200)).toBe('p1');
        expect(dominantVisibleItem(layouts, 550, 100)).toBe('p1');
        expect(dominantVisibleItem(layouts, 551, 100)).toBe('p2');
    });

    it('restores by stable id before the stale numeric index', () => {
        expect(restoreLocationById(['p1', 'p2', 'p3'], { itemId: 'p2', index: 0 })).toEqual({ itemId: 'p2', index: 1 });
        expect(restoreLocationById(['p1', 'p2'], { itemId: 'missing', index: 9 })).toEqual({ itemId: 'p2', index: 1 });
    });

    it('clips normalized overlay vertices and preserves double/RTL grouping', () => {
        expect(
            overlayBox([
                { index: 0, x: -1, y: 0.1 },
                { index: 1, x: 0.9, y: 0.1 },
                { index: 2, x: 0.9, y: 1.5 },
                { index: 3, x: 0.1, y: 0.8 },
            ]),
        ).toEqual({ left: 0, top: 0.1, width: 0.9, height: 0.9 });
        expect(
            groupedImageItems(items, { ...DEFAULT_USER_SETTINGS.reader, mode: 'DOUBLE', direction: 'RTL' }).map(group => group.map(item => item.id)),
        ).toEqual([['p2', 'p1'], ['p3']]);
    });
});
