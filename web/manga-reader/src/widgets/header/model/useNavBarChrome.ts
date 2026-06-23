import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 8;

type NavBarChromeHandlers = {
    focusSearch: () => void;
    setSearchFocused: (focused: boolean) => void;
    setOpenSection: (section: string | null) => void;
};

/**
 * Header chrome behavior for the NavBar: shrinks on scroll and wires the
 * Cmd/Ctrl+K (focus search) and Escape (collapse) shortcuts.
 */
const useNavBarChrome = ({ focusSearch, setSearchFocused, setOpenSection }: NavBarChromeHandlers) => {
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
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();

                focusSearch();

                setSearchFocused(true);
            }

            if (e.key === 'Escape') {
                setOpenSection(null);

                setSearchFocused(false);

                (document.activeElement as HTMLElement | null)?.blur?.();
            }
        };

        document.addEventListener('keydown', onKey);

        return () => document.removeEventListener('keydown', onKey);
    }, [focusSearch, setSearchFocused, setOpenSection]);

    return { isScrolled };
};

export default useNavBarChrome;
