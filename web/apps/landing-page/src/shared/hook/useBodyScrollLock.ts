import { useEffect } from 'react';

/**
 * Trava o scroll do body enquanto locked for true.
 */
export function useBodyScrollLock(locked: boolean): void {
    useEffect(() => {
        if (!locked) return;

        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = original;
        };
    }, [locked]);
}
