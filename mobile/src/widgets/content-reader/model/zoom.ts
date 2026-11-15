export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export interface ZoomState {
    scale: number;
    x: number;
    y: number;
}
export const ZOOM_RESET: ZoomState = { scale: ZOOM_MIN, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function clampScale(scale: number): number {
    return Number.isFinite(scale) ? clamp(scale, ZOOM_MIN, ZOOM_MAX) : ZOOM_MIN;
}
/** Keeps the scaled content covering the viewport: no empty gutter appears while panning. */
export function clampTranslation(value: number, scale: number, size: number): number {
    const limit = (Math.max(ZOOM_MIN, scale) - 1) * size * 0.5;
    return Number.isFinite(value) ? clamp(value, -limit, limit) : 0;
}
export function isZoomed(state: ZoomState): boolean {
    return state.scale > ZOOM_MIN + 0.001;
}
/** Zoom keeping the content point under `focal` (relative to the viewport centre) fixed. */
export function zoomAround(from: ZoomState, nextScale: number, focal: { x: number; y: number }, size: { width: number; height: number }): ZoomState {
    const scale = clampScale(nextScale);
    if (scale <= ZOOM_MIN) return ZOOM_RESET;
    const ratio = scale / from.scale;
    return {
        scale,
        x: clampTranslation(focal.x - (focal.x - from.x) * ratio, scale, size.width),
        y: clampTranslation(focal.y - (focal.y - from.y) * ratio, scale, size.height),
    };
}
export function panBy(from: ZoomState, delta: { x: number; y: number }, size: { width: number; height: number }): ZoomState {
    if (!isZoomed(from)) return ZOOM_RESET;
    return { scale: from.scale, x: clampTranslation(from.x + delta.x, from.scale, size.width), y: clampTranslation(from.y + delta.y, from.scale, size.height) };
}
