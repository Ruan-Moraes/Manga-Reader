import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { readStoredUserSettings, subscribeStoredUserSettings, updateStoredUserSettings, SETTINGS_STORAGE_KEY, type UserSettings } from '@entities/user';

import { TOTAL_PAGES } from './readerData';

export type ReadMode = 'vertical' | 'paged' | 'double';
export type Direction = 'ltr' | 'rtl';
export type Fit = 'width' | 'height' | 'original';
export type Bg = 'black' | 'dark' | 'paper';

export const TOTAL = TOTAL_PAGES;

interface ReaderPrefs {
    mode: ReadMode;
    direction: Direction;
    fit: Fit;
    gap: number;
    bg: Bg;
    inlineCmts: boolean;
}

const PREFS_KEY = 'reader:prefs';
const posKey = (titleId: string | undefined) => `reader:pos:${titleId ?? 'unknown'}`;

const DEFAULT_PREFS: ReaderPrefs = {
    mode: 'vertical',
    direction: 'rtl',
    fit: 'width',
    gap: 8,
    bg: 'dark',
    inlineCmts: true,
};

const toReaderPrefs = (settings: UserSettings, previous?: ReaderPrefs): ReaderPrefs => ({
    mode: settings.reader.direction === 'WEBTOON' ? 'vertical' : (settings.reader.mode.toLowerCase() as ReadMode),
    direction: settings.reader.direction === 'LTR' ? 'ltr' : 'rtl',
    fit: settings.reader.fit.toLowerCase() as Fit,
    gap: settings.reader.gap,
    bg: settings.reader.background.toLowerCase() as Bg,
    inlineCmts: previous?.inlineCmts ?? DEFAULT_PREFS.inlineCmts,
});

const toSettingsMode = (mode: ReadMode): UserSettings['reader']['mode'] => mode.toUpperCase() as UserSettings['reader']['mode'];
const toSettingsDirection = (direction: Direction): UserSettings['reader']['direction'] => (direction === 'ltr' ? 'LTR' : 'RTL');
const toSettingsFit = (fit: Fit): UserSettings['reader']['fit'] => fit.toUpperCase() as UserSettings['reader']['fit'];
const toSettingsBackground = (bg: Bg): UserSettings['reader']['background'] => bg.toUpperCase() as UserSettings['reader']['background'];

const samePrefs = (left: ReaderPrefs, right: ReaderPrefs) =>
    left.mode === right.mode &&
    left.direction === right.direction &&
    left.fit === right.fit &&
    left.gap === right.gap &&
    left.bg === right.bg &&
    left.inlineCmts === right.inlineCmts;

const readPrefs = (): ReaderPrefs => {
    try {
        const systemPrefs = toReaderPrefs(readStoredUserSettings());
        const raw = localStorage.getItem(PREFS_KEY);

        if (!raw) {
            return systemPrefs;
        }

        const legacy = JSON.parse(raw) as Partial<ReaderPrefs>;

        if (!localStorage.getItem(SETTINGS_STORAGE_KEY)) {
            return { ...DEFAULT_PREFS, ...legacy };
        }

        return { ...systemPrefs, inlineCmts: legacy.inlineCmts ?? systemPrefs.inlineCmts };
    } catch {
        return DEFAULT_PREFS;
    }
};

const readSavedPage = (titleId: string | undefined, chapter: number): number => {
    try {
        const raw = localStorage.getItem(posKey(titleId));
        if (!raw) return 1;
        const pos = JSON.parse(raw) as { chapter?: number; page?: number };
        return pos.chapter === chapter && pos.page ? Math.min(TOTAL, Math.max(1, pos.page)) : 1;
    } catch {
        return 1;
    }
};

export function useChapterReader(titleId: string | undefined, chapterParam: string | undefined) {
    const navigate = useAppNavigate();
    const chapter = Number(chapterParam) || 1;

    const initialPrefs = useMemo(readPrefs, []);

    const [mode, setMode] = useState<ReadMode>(initialPrefs.mode);
    const [direction, setDirection] = useState<Direction>(initialPrefs.direction);
    const [fit, setFit] = useState<Fit>(initialPrefs.fit);
    const [gap, setGap] = useState<number>(initialPrefs.gap);
    const [bg, setBg] = useState<Bg>(initialPrefs.bg);
    const [inlineCmts, setInlineCmts] = useState<boolean>(initialPrefs.inlineCmts);

    const [page, setPage] = useState(() => readSavedPage(titleId, chapter));
    const [saved, setSaved] = useState(false);

    const [topbarHidden, setTopbarHidden] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [chaptersOpen, setChaptersOpen] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);

    const [rating, setRating] = useState(0);

    const listRef = useRef<HTMLDivElement>(null);
    const lastY = useRef(0);
    const didInitPrefs = useRef(false);
    const applyingExternalPrefs = useRef(false);

    const step = mode === 'double' ? 2 : 1;
    const lastPage = mode === 'vertical' ? TOTAL : TOTAL + 1;

    const currentPrefs = useMemo<ReaderPrefs>(() => ({ mode, direction, fit, gap, bg, inlineCmts }), [mode, direction, fit, gap, bg, inlineCmts]);

    const applyPrefs = useCallback(
        (next: ReaderPrefs) => {
            if (samePrefs(currentPrefs, next)) return;

            applyingExternalPrefs.current = true;
            setMode(next.mode);
            setDirection(next.direction);
            setFit(next.fit);
            setGap(next.gap);
            setBg(next.bg);
            setInlineCmts(next.inlineCmts);
        },
        [currentPrefs],
    );

    // ---------- persist preferences ----------
    useEffect(() => {
        if (!didInitPrefs.current) {
            didInitPrefs.current = true;
            return;
        }

        if (applyingExternalPrefs.current) {
            applyingExternalPrefs.current = false;
            return;
        }

        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(currentPrefs));
        } catch {
            /* ignore */
        }

        updateStoredUserSettings(current => ({
            ...current,
            reader: {
                ...current.reader,
                mode: toSettingsMode(mode),
                direction: mode === 'vertical' && current.reader.direction === 'WEBTOON' ? 'WEBTOON' : toSettingsDirection(direction),
                fit: toSettingsFit(fit),
                gap,
                background: toSettingsBackground(bg),
            },
        }));
    }, [currentPrefs, mode, direction, fit, gap, bg]);

    useEffect(
        () =>
            subscribeStoredUserSettings(settings => {
                applyPrefs(toReaderPrefs(settings, currentPrefs));
            }),
        [applyPrefs, currentPrefs],
    );

    // ---------- persist reading position ----------
    useEffect(() => {
        try {
            localStorage.setItem(posKey(titleId), JSON.stringify({ chapter, page }));
        } catch {
            /* ignore */
        }
    }, [titleId, chapter, page]);

    // ---------- navigation ----------
    const goNext = useCallback(() => {
        if (mode === 'vertical') {
            const el = listRef.current?.querySelector(`[data-rd-page="${page + 1}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        setPage(p => Math.min(lastPage, p + step));
    }, [mode, page, lastPage, step]);

    const goPrev = useCallback(() => {
        if (mode === 'vertical') {
            const el = listRef.current?.querySelector(`[data-rd-page="${Math.max(1, page - 1)}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        setPage(p => Math.max(1, p - step));
    }, [mode, page, step]);

    const goToPage = useCallback(
        (n: number) => {
            const target = Math.max(1, Math.min(TOTAL, n));
            if (mode === 'vertical') {
                const el = listRef.current?.querySelector(`[data-rd-page="${target}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setPage(target);
        },
        [mode],
    );

    const switchChapter = useCallback(
        (delta: number) => {
            const next = Math.max(1, chapter + delta);
            if (next === chapter) return;
            setChaptersOpen(false);
            navigate(ROUTES.CHAPTER(titleId ?? '', next));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [chapter, navigate, titleId],
    );

    const pickChapter = useCallback(
        (n: number) => {
            setChaptersOpen(false);
            if (n === chapter) return;
            navigate(ROUTES.CHAPTER(titleId ?? '', n));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [chapter, navigate, titleId],
    );

    const goBack = useCallback(() => navigate(ROUTES.TITLE_DETAIL(titleId ?? '')), [navigate, titleId]);

    // ---------- scroll: auto-hide chrome + page tracking (vertical) ----------
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setTopbarHidden(y > 120 && y > lastY.current);
            lastY.current = y;

            if (mode !== 'vertical' || !listRef.current) return;
            const pages = listRef.current.querySelectorAll<HTMLElement>('[data-rd-page]');
            let bestIdx = 1;
            let bestDist = Infinity;
            pages.forEach(el => {
                const r = el.getBoundingClientRect();
                const dist = Math.abs(r.top + r.height / 2 - window.innerHeight / 2);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = Number(el.dataset.rdPage);
                }
            });
            setPage(prev => (bestIdx !== prev ? bestIdx : prev));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [mode]);

    // ---------- keyboard shortcuts ----------
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
            if (e.key === 'Escape') {
                if (settingsOpen) return setSettingsOpen(false);
                if (chaptersOpen) return setChaptersOpen(false);
                if (commentsOpen) return setCommentsOpen(false);
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
                e.preventDefault();
                goNext();
            }
            if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
                e.preventDefault();
                goPrev();
            }
            if (e.key === 's' || e.key === 'S') setSettingsOpen(v => !v);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNext, goPrev, settingsOpen, chaptersOpen, commentsOpen]);

    const fillPct = ((page - 1) / Math.max(1, TOTAL - 1)) * 100;
    const isEnd = mode !== 'vertical' && page > TOTAL;

    return {
        // route-derived
        chapter,
        // prefs
        mode,
        direction,
        fit,
        gap,
        bg,
        inlineCmts,
        setMode,
        setDirection,
        setFit,
        setGap,
        setBg,
        setInlineCmts,
        // reading state
        page,
        setPage,
        saved,
        setSaved,
        step,
        fillPct,
        isEnd,
        // panels
        topbarHidden,
        settingsOpen,
        setSettingsOpen,
        chaptersOpen,
        setChaptersOpen,
        commentsOpen,
        setCommentsOpen,
        // end of chapter
        rating,
        setRating,
        // refs + actions
        listRef,
        goNext,
        goPrev,
        goToPage,
        switchChapter,
        pickChapter,
        goBack,
    };
}

export type ReaderState = ReturnType<typeof useChapterReader>;
