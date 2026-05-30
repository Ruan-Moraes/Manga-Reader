import { useCallback, useEffect, useRef, useState } from 'react';

export type ReadMode = 'vertical' | 'paged' | 'double';
export type Direction = 'ltr' | 'rtl';
export type Fit = 'width' | 'height' | 'original';
export type Bg = 'black' | 'dark' | 'paper';

export const BG_CLASS: Record<Bg, string> = {
    black: 'bg-black',
    dark: 'bg-[#111]',
    paper: 'bg-[#f5f0e8]',
};

export const TOTAL_PAGES = 18;

export const PAGE_PLACEHOLDERS = Array.from({ length: TOTAL_PAGES }, (_, i) => ({
    num: i + 1,
    gradient: `linear-gradient(160deg, #1a1a1a ${i % 2 === 0 ? '0%' : '20%'}, #252526 100%)`,
}));

export const KEYBOARD_SHORTCUTS = [
    { id: 'prevPage', keys: ['←', 'K'], action: 'Página anterior' },
    { id: 'nextPage', keys: ['→', 'J'], action: 'Próxima página' },
    { id: 'settings', keys: ['S'], action: 'Configurações' },
    { id: 'saveLibrary', keys: ['B'], action: 'Salvar na biblioteca' },
    { id: 'close', keys: ['Esc'], action: 'Fechar drawer / voltar' },
] as const;

/** Height of the sticky reader chrome in pixels. */
export const CHROME_HEIGHT = 56;

export function useChapterReader(titleId: string | undefined, chapter: string | undefined) {
    const [page, setPage] = useState(1);
    const [mode, setMode] = useState<ReadMode>('vertical');
    const [dir, setDir] = useState<Direction>('rtl');
    const [fit, setFit] = useState<Fit>('width');
    const [bg, setBg] = useState<Bg>('dark');
    const [saved, setSaved] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [ratingGiven, setRatingGiven] = useState(0);

    const chromeRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastScroll = useRef(0);

    const chNum = chapter ?? '1';
    const step = mode === 'double' ? 2 : 1;
    const isEnd = page >= TOTAL_PAGES;
    const progress = Math.round((page / TOTAL_PAGES) * 100);

    const prevPage = () => setPage(p => Math.max(1, p - step));
    const nextPage = () => {
        if (page + step > TOTAL_PAGES) return;
        setPage(p => Math.min(TOTAL_PAGES, p + step));
    };

    const handleScroll = useCallback(() => {
        if (drawerOpen) return;
        const delta = window.scrollY - lastScroll.current;
        lastScroll.current = window.scrollY;
        const hide = delta > 4 && window.scrollY > 120;
        const show = delta < -4;
        if (hide || show) {
            const opacity = hide ? '0' : '1';
            const pointerEvents = hide ? 'none' : 'auto';
            chromeRef.current?.style.setProperty('opacity', opacity);
            chromeRef.current?.style.setProperty('pointer-events', pointerEvents);
            bottomRef.current?.style.setProperty('opacity', opacity);
            bottomRef.current?.style.setProperty('pointer-events', pointerEvents);
        }
    }, [drawerOpen]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
            if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
                if (mode !== 'vertical') setPage(p => Math.min(TOTAL_PAGES, p + step));
            }
            if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
                if (mode !== 'vertical') setPage(p => Math.max(1, p - step));
            }
            if (e.key === 's' || e.key === 'S') setDrawerOpen(o => !o);
            if (e.key === 'Escape') {
                setDrawerOpen(false);
                setCommentsOpen(false);
            }
            if (e.key === 'b' || e.key === 'B') setSaved(s => !s);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [mode, step]);

    return {
        page,
        mode,
        dir,
        fit,
        bg,
        saved,
        drawerOpen,
        commentsOpen,
        comment,
        ratingGiven,
        chNum,
        step,
        isEnd,
        progress,
        chromeRef,
        bottomRef,
        titleId,
        setPage,
        setMode,
        setDir,
        setFit,
        setBg,
        setSaved,
        setDrawerOpen,
        setCommentsOpen,
        setComment,
        setRatingGiven,
        prevPage,
        nextPage,
    };
}
