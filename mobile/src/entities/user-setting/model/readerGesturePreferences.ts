export type ReaderControlsMode = 'TAP' | 'SWIPE' | 'TAP_OR_SWIPE' | 'VISIBLE';

export interface ReaderGesturePreferences {
    controlsMode: ReaderControlsMode;
    sideTapNavigation: boolean;
}

export const DEFAULT_READER_GESTURES: ReaderGesturePreferences = { controlsMode: 'TAP_OR_SWIPE', sideTapNavigation: false };

const MODES: readonly ReaderControlsMode[] = ['TAP', 'SWIPE', 'TAP_OR_SWIPE', 'VISIBLE'];

export function normalizeReaderGestures(value: unknown): ReaderGesturePreferences {
    const source = value && typeof value === 'object' ? (value as Partial<ReaderGesturePreferences>) : {};

    return {
        controlsMode: MODES.includes(source.controlsMode!) ? source.controlsMode! : DEFAULT_READER_GESTURES.controlsMode,
        sideTapNavigation: typeof source.sideTapNavigation === 'boolean' ? source.sideTapNavigation : false,
    };
}
