import { useCallback, useRef } from 'react';
import * as ExpoRouter from 'expo-router';

// Resolved once (tests have no navigator), so the hook order never changes between renders.
const useFocusEffectIfAvailable: (effect: () => void) => void =
    typeof (ExpoRouter as { useFocusEffect?: unknown }).useFocusEffect === 'function'
        ? (ExpoRouter as unknown as { useFocusEffect: (effect: () => void) => void }).useFocusEffect
        : () => undefined;

/**
 * Runs `onFocus` whenever the screen comes back into focus (not on the first focus). Used to refresh state that other
 * screens may have changed, such as a batch retried from the reader. No-op outside a navigator (tests).
 */
export function useScreenRefocus(onFocus: () => void): void {
    const first = useRef(true);
    const callback = useRef(onFocus);
    callback.current = onFocus;
    const effect = useCallback(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        callback.current();
    }, []);
    useFocusEffectIfAvailable(effect);
}
