import { clampScale, clampTranslation, isZoomed, panBy, ZOOM_MAX, ZOOM_RESET, zoomAround } from '../zoom';

const size = { width: 400, height: 800 };

it('limits scale between the original size and the maximum', () => {
    expect(clampScale(0.2)).toBe(1);
    expect(clampScale(99)).toBe(ZOOM_MAX);
    expect(clampScale(Number.NaN)).toBe(1);
});
it('keeps the content point under the focal fixed', () => {
    const next = zoomAround(ZOOM_RESET, 2, { x: 100, y: 0 }, size);
    expect(next).toEqual({ scale: 2, x: 100 - 100 * 2, y: 0 });
    // the point at q = 100 relative to centre was at 100 and is still at x + 2*q after scaling
    expect(next.x + next.scale * 100 - 0).toBeCloseTo(100 + 0, 5);
});
it('returns to the exact reset state when scaling back to 1', () => {
    const zoomed = zoomAround(ZOOM_RESET, 3, { x: 50, y: 20 }, size);
    expect(zoomAround(zoomed, 1, { x: 0, y: 0 }, size)).toEqual(ZOOM_RESET);
    expect(isZoomed(zoomed)).toBe(true);
    expect(isZoomed(ZOOM_RESET)).toBe(false);
});
it('never pans beyond the scaled edges and ignores panning at scale 1', () => {
    expect(clampTranslation(10_000, 2, 400)).toBe(200);
    expect(clampTranslation(-10_000, 2, 400)).toBe(-200);
    expect(panBy(ZOOM_RESET, { x: 50, y: 50 }, size)).toEqual(ZOOM_RESET);
    expect(panBy({ scale: 2, x: 190, y: 0 }, { x: 50, y: -10 }, size)).toEqual({ scale: 2, x: 200, y: -10 });
});
