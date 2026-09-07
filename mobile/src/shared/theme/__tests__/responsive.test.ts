import { resolveResponsiveLayout } from '../responsive';

describe('responsive layout', () => {
    it.each([
        [320, 568, 'compact', 1],
        [390, 844, 'regular', 2],
        [600, 960, 'medium', 2],
        [840, 600, 'expanded', 4],
    ] as const)('classifies %sx%s', (width, height, sizeClass, reviewColumns) => {
        expect(resolveResponsiveLayout(width, height)).toEqual(
            expect.objectContaining({ sizeClass, reviewColumns, orientation: width > height ? 'landscape' : 'portrait' }),
        );
    });

    it('marks short landscape layouts', () => {
        expect(resolveResponsiveLayout(840, 500)).toEqual(expect.objectContaining({ lowHeight: true, orientation: 'landscape' }));
    });
});
