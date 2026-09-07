import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 8;

type NavBarChromeHandlers = {
    setOpenSection: (section: string | null) => void;
};

/**
 * Header chrome behavior for the NavBar: shrinks on scroll and wires the
 * Handles the shrinking header and Escape for the mega-menu.
 * Global search owns its keyboard behavior in the search feature.
 */
const useNavBarChrome = ({ setOpenSection }: NavBarChromeHandlers) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        let raf = 0;

        const onScroll = () => {
            if (raf) return;

            raf = requestAnimationFrame(() => {
                setIsScrolled(window.scrollY + 8 > SCROLL_THRESHOLD);

                raf = 0;
            });
        };

        onScroll();

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);

            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpenSection(null);
            }
        };

        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, [setOpenSection]);

    return { isScrolled };
};

export default useNavBarChrome;
