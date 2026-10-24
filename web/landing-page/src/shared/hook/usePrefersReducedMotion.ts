import { useEffect, useState } from 'react';

/**
 * Hook para detectar preferência do usuário por movimento reduzido.
 */
export function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const mediaQuery = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        const listener = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener?.('change', listener);
        return () => mediaQuery.removeEventListener?.('change', listener);
    }, []);

    return prefersReducedMotion;
}
