import { useCallback, useEffect, useRef } from 'react';
import * as ExpoRouter from 'expo-router';

interface GuardedNavigation {
    addListener(event: 'beforeRemove', callback: (event: { preventDefault(): void }) => void): () => void;
    setOptions?(options: { gestureEnabled?: boolean }): void;
}

// Tests and non-navigator renders have no navigation: the guard then does nothing. Resolved once, so the hook order
// never changes between renders.
const useNavigationIfAvailable: () => unknown =
    typeof (ExpoRouter as { useNavigation?: unknown }).useNavigation === 'function'
        ? (ExpoRouter as unknown as { useNavigation: () => unknown }).useNavigation
        : () => null;

/**
 * Routes the system back (Android back button, iOS swipe) through the screen's own back logic while `active`.
 * The swipe is disabled while guarded, because a native swipe cannot be undone once it finishes. Call `allowLeave()`
 * right before navigating away on purpose, so that navigation is not intercepted.
 */
export function useLeaveGuard(active: boolean, onAttempt: () => void): { allowLeave: () => void } {
    const navigation = useNavigationIfAvailable() as GuardedNavigation | null;
    const allowed = useRef(false);
    const attempt = useRef(onAttempt);
    attempt.current = onAttempt;

    useEffect(() => {
        if (!navigation?.addListener) return;
        navigation.setOptions?.({ gestureEnabled: !active });
        if (!active) return;
        return navigation.addListener('beforeRemove', event => {
            if (allowed.current) return;
            event.preventDefault();
            attempt.current();
        });
    }, [active, navigation]);

    const allowLeave = useCallback(() => {
        allowed.current = true;
    }, []);

    return { allowLeave };
}
