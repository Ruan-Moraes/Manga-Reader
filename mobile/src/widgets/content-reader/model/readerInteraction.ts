import type { ReaderControlsMode } from '@/entities/user-setting';

export const READER_GESTURE_LIMITS = { tapSlop: 8, tapDuration: 300, swipeDistance: 24, swipeHorizontal: 16, swipeDuration: 400, settleDelay: 80 } as const;
export interface ReaderInteractionState {
    mode: ReaderControlsMode;
    visible: boolean;
    dragging: boolean;
    momentum: boolean;
    active: boolean;
}
export type ReaderInteractionEvent =
    | { type: 'preference'; mode: ReaderControlsMode }
    | { type: 'hide' | 'reveal' | 'toggle' | 'dragStart' | 'dragEnd' | 'momentumStart' | 'momentumEnd' | 'background' | 'foreground' };

export const createReaderInteraction = (mode: ReaderControlsMode): ReaderInteractionState => ({
    mode,
    visible: mode === 'VISIBLE',
    dragging: false,
    momentum: false,
    active: true,
});
export function readerInteractionReducer(state: ReaderInteractionState, event: ReaderInteractionEvent): ReaderInteractionState {
    const next = { ...state };
    switch (event.type) {
        case 'preference':
            next.mode = event.mode;
            break;
        case 'dragStart':
            next.dragging = true;
            break;
        case 'dragEnd':
            next.dragging = false;
            break;
        case 'momentumStart':
            next.momentum = true;
            break;
        case 'momentumEnd':
            next.momentum = false;
            break;
        case 'background':
            next.active = false;
            next.dragging = false;
            next.momentum = false;
            break;
        case 'foreground':
            next.active = true;
            break;
        case 'hide':
            next.visible = false;
            break;
        case 'reveal':
            next.visible = true;
            break;
        case 'toggle':
            next.visible = !next.visible;
            break;
    }
    if (!next.active || next.dragging || next.momentum) next.visible = false;
    else if (next.mode === 'VISIBLE' && !['hide', 'toggle'].includes(event.type)) next.visible = true;
    return Object.keys(next).every(key => next[key as keyof ReaderInteractionState] === state[key as keyof ReaderInteractionState]) ? state : next;
}
export function validRevealSwipe(x: number, y: number, duration: number): boolean {
    return (
        Math.abs(x) <= READER_GESTURE_LIMITS.swipeHorizontal &&
        y <= -READER_GESTURE_LIMITS.swipeDistance &&
        duration >= 0 &&
        duration <= READER_GESTURE_LIMITS.swipeDuration
    );
}
export function resolveReaderTap({
    x,
    width,
    visible,
    mode,
    sideNavigation,
    paged,
    rtl,
}: {
    x: number;
    width: number;
    visible: boolean;
    mode: ReaderControlsMode;
    sideNavigation: boolean;
    paged: boolean;
    rtl: boolean;
}): 'hide' | 'toggle' | 'next' | 'previous' | 'none' {
    if (visible) return 'hide';
    if (paged && sideNavigation && (x < width * 0.25 || x > width * 0.75)) return x < width * 0.25 !== rtl ? 'previous' : 'next';
    return mode === 'TAP' || mode === 'TAP_OR_SWIPE' ? 'toggle' : 'none';
}
