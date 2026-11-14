import { useEffect, useState } from 'react';

/**
 * Detecta se a página foi rolada além de um limiar em pixels.
 * Utiliza requestAnimationFrame para sincronizar com os frames do display
 * e evitar leituras síncronas excessivas de layout em cada evento de scroll.
 */
export function useScrolled(threshold = 24): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;

        const updateScrolled = () => {
            const next = window.scrollY > threshold;
            setScrolled(prev => (prev !== next ? next : prev));
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateScrolled);
            }
        };

        updateScrolled();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    return scrolled;
}
