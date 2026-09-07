import { useEffect, useRef, useState } from 'react';

const SCROLL_DELTA_THRESHOLD = 8;
const TAB_BAR_IDLE_REAPPEAR_DELAY_MS = 2500;

/**
 * Esconde a tab bar ao rolar para baixo e traz de volta ao rolar para cima
 * ou quando o scroll para (idle) — mesmo padrão de rAF-throttle do
 * useNavBarChrome do header.
 */
const useTabBarVisibility = () => {
    const [visible, setVisible] = useState(true);
    const lastYRef = useRef(0);

    useEffect(() => {
        lastYRef.current = window.scrollY;

        let raf = 0;
        let idleTimer = 0;

        const onScroll = () => {
            if (raf) return;

            raf = requestAnimationFrame(() => {
                const y = window.scrollY;
                const delta = y - lastYRef.current;

                if (y <= 0 || delta < -SCROLL_DELTA_THRESHOLD) {
                    setVisible(true);
                } else if (delta > SCROLL_DELTA_THRESHOLD) {
                    setVisible(false);
                }

                lastYRef.current = y;
                raf = 0;

                window.clearTimeout(idleTimer);
                idleTimer = window.setTimeout(() => setVisible(true), TAB_BAR_IDLE_REAPPEAR_DELAY_MS);
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);

            if (raf) cancelAnimationFrame(raf);

            window.clearTimeout(idleTimer);
        };
    }, []);

    return visible;
};

export default useTabBarVisibility;
