import { useEffect, useState } from 'react';

/**
 * Observa um media query. Em ambientes sem `matchMedia` (SSR/jsdom) retorna `false`,
 * garantindo o caminho mobile-first como padrão.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false));

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return;
        }

        const mql = window.matchMedia(query);
        const handler = () => setMatches(mql.matches);

        handler();
        mql.addEventListener('change', handler);

        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

export default useMediaQuery;
