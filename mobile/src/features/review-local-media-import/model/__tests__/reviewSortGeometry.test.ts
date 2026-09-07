import {
    reorderReviewItems,
    resolveReviewDropIndex,
    resolveReviewEdgeVelocity,
    resolveReviewItemShift,
    resolveReviewRowPitch,
    resolveReviewScrollOffset,
    resolveReviewTouchIndex,
} from '../reviewSortGeometry';

const geometry = { columnCount: 2, itemWidth: 176, gap: 8, rowPitch: 242 };

describe('MOB-FEAT-043 stable sortable geometry', () => {
    it('requires crossing the midpoint plus hysteresis, including on reversal', () => {
        const drop = (x: number, previousIndex: number) =>
            resolveReviewDropIndex({ ...geometry, fromIndex: 0, previousIndex, itemCount: 4, translation: { x, y: 0 } });
        expect(drop(99, 0)).toBe(0);
        expect(drop(101, 0)).toBe(1);
        expect(drop(85, 1)).toBe(1);
        expect(drop(83, 1)).toBe(0);
    });

    it.each([1, 2, 4])('allows multi-slot jumps and incomplete final rows with %s columns', columnCount => {
        expect(resolveReviewDropIndex({ ...geometry, columnCount, fromIndex: 0, previousIndex: 0, itemCount: 9, translation: { x: 1000, y: 3000 } })).toBe(8);
    });

    it('accelerates quadratically towards the edge and stops outside it', () => {
        expect(resolveReviewEdgeVelocity(200, 400)).toBe(0);
        expect(resolveReviewEdgeVelocity(28, 400)).toBe(-120);
        expect(resolveReviewEdgeVelocity(372, 400)).toBe(120);
        expect(resolveReviewEdgeVelocity(500, 400)).toBe(480);
        expect(resolveReviewEdgeVelocity(0, 0)).toBe(0);
    });

    it('accepts only images, excluding gaps, list actions and footer', () => {
        const hit = (x: number, y: number, mode: 'grid' | 'list' = 'grid') =>
            resolveReviewTouchIndex({ ...geometry, columnCount: mode === 'list' ? 1 : 2, itemCount: 3, mode, x, y });
        expect(hit(20, 20)).toBe(0);
        expect(hit(180, 20)).toBe(-1);
        expect(hit(200, 260)).toBe(-1);
        expect(hit(20, 900)).toBe(-1);
        expect(hit(20, 20, 'list')).toBe(0);
        expect(hit(150, 20, 'list')).toBe(-1);
        expect(hit(20, 200, 'list')).toBe(-1);
    });
    it('clamps columns without wrapping across row edges', () => {
        expect(resolveReviewDropIndex({ ...geometry, fromIndex: 2, itemCount: 6, translation: { x: -300, y: 0 } })).toBe(2);
        expect(resolveReviewDropIndex({ ...geometry, fromIndex: 1, itemCount: 6, translation: { x: 300, y: 0 } })).toBe(1);
        expect(resolveReviewDropIndex({ ...geometry, fromIndex: 0, itemCount: 5, translation: { x: 200, y: 2000 } })).toBe(4);
    });

    it('uses measured row height for tall list content', () => {
        expect(resolveReviewDropIndex({ ...geometry, columnCount: 1, rowPitch: 240, fromIndex: 0, itemCount: 10, translation: { x: 0, y: 360 } })).toBe(2);
        expect(resolveReviewItemShift({ ...geometry, columnCount: 1, rowPitch: 240, index: 1, fromIndex: 0, toIndex: 3 })).toEqual({ x: 0, y: -240 });
    });

    it('distinguishes a single-column grid from the horizontal list and accounts for constant borders', () => {
        expect(resolveReviewRowPitch('grid', 176, 8)).toBe(242);
        expect(resolveReviewRowPitch('list', 176, 8)).toBeCloseTo(143.3333);
        expect(resolveReviewRowPitch('grid', 360, 8)).toBeGreaterThan(resolveReviewRowPitch('list', 360, 8));
    });

    it('keeps edge scrolling time-based, bounded and safe after a stalled frame', () => {
        expect(resolveReviewScrollOffset(0, 1, 16, 480, 1000)).toBe(7.68);
        expect(resolveReviewScrollOffset(0, -1, 16, 480, 1000)).toBe(0);
        expect(resolveReviewScrollOffset(999, 1, 16, 480, 1000)).toBe(1000);
        expect(resolveReviewScrollOffset(0, 1, 1000, 480, 1000)).toBe(15.36);
    });

    it('does not lose items on invalid drops or mutate the source', () => {
        const items = ['a', 'b', 'c'];
        expect(reorderReviewItems(items, -1, 2)).toEqual(items);
        expect(reorderReviewItems(items, 0, 8)).toEqual(items);
        expect(reorderReviewItems(items, 0, 2)).toEqual(['b', 'c', 'a']);
        expect(items).toEqual(['a', 'b', 'c']);
    });
});
