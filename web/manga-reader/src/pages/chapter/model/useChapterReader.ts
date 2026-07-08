import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { readStoredUserSettings, subscribeStoredUserSettings, updateStoredUserSettings, SETTINGS_STORAGE_KEY, type UserSettings } from '@entities/user';
import { readerProgressGateway } from '@entities/chapter';

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
}

const PREFS_KEY = 'reader:prefs';

const DEFAULT_PREFS: ReaderPrefs = {
    mode: 'vertical',
    direction: 'rtl',
    fit: 'width',
    gap: 8,
    bg: 'dark',
};

const toReaderPrefs = (settings: UserSettings): ReaderPrefs => ({
    mode: settings.reader.direction === 'WEBTOON' ? 'vertical' : (settings.reader.mode.toLowerCase() as ReadMode),
    direction: settings.reader.direction === 'LTR' ? 'ltr' : 'rtl',
    fit: settings.reader.fit.toLowerCase() as Fit,
    gap: settings.reader.gap,
    bg: settings.reader.background.toLowerCase() as Bg,
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
    left.bg === right.bg;

const readPrefs = (): ReaderPrefs => {
    try {
        const systemPrefs = toReaderPrefs(readStoredUserSettings());
        const raw = localStorage.getItem(PREFS_KEY);

        if (!raw) {
            return systemPrefs;
        }

        const stored = JSON.parse(raw) as Partial<ReaderPrefs> & { inlineCmts?: unknown };

        // Migração: o campo `inlineCmts` foi removido do leitor — limpa resíduos persistidos.
        if ('inlineCmts' in stored) {
            const { inlineCmts: _removed, ...cleaned } = stored;
            try {
                localStorage.setItem(PREFS_KEY, JSON.stringify(cleaned));
            } catch {
                /* ignore */
            }
            if (!localStorage.getItem(SETTINGS_STORAGE_KEY)) {
                return { ...DEFAULT_PREFS, ...cleaned };
            }
            return systemPrefs;
        }

        if (!localStorage.getItem(SETTINGS_STORAGE_KEY)) {
            return { ...DEFAULT_PREFS, ...stored };
        }

        return systemPrefs;
    } catch {
        return DEFAULT_PREFS;
    }
};

/** Continuação da última página lida (mesmas chaves legadas, via gateway). */
const readSavedPage = (titleId: string | undefined, chapter: number, total: number): number => {
    if (!titleId) return 1;
    const pos = readerProgressGateway.getProgress(titleId);
    return pos && pos.chapter === chapter && pos.page ? Math.min(total, Math.max(1, pos.page)) : 1;
};

export function useChapterReader(titleId: string | undefined, chapterParam: string | undefined, maxChapter?: number, totalPages?: number) {
    const navigate = useAppNavigate();
    const chapter = Number(chapterParam) || 1;
    const lastChapter = maxChapter && maxChapter > 0 ? maxChapter : undefined;
    // Total de páginas real (gateway) com fallback no placeholder legado.
    // `totalPages` chega assíncrono: undefined enquanto carrega/fallback.
    const hasRealTotal = totalPages !== undefined && totalPages > 0;
    const total = hasRealTotal ? totalPages : TOTAL_PAGES;

    const initialPrefs = useMemo(readPrefs, []);

    const [mode, setMode] = useState<ReadMode>(initialPrefs.mode);
    const [direction, setDirection] = useState<Direction>(initialPrefs.direction);
    const [fit, setFit] = useState<Fit>(initialPrefs.fit);
    const [gap, setGap] = useState<number>(initialPrefs.gap);
    const [bg, setBg] = useState<Bg>(initialPrefs.bg);

    // Sem clamp na restauração: o total real ainda não chegou no mount — o
    // efeito abaixo re-clampa quando ele resolve (evita perder o bookmark).
    const [page, setPage] = useState(() => readSavedPage(titleId, chapter, Number.MAX_SAFE_INTEGER));
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
    const lastPage = mode === 'vertical' ? total : total + 1;

    const currentPrefs = useMemo<ReaderPrefs>(() => ({ mode, direction, fit, gap, bg }), [mode, direction, fit, gap, bg]);

    const applyPrefs = useCallback(
        (next: ReaderPrefs) => {
            if (samePrefs(currentPrefs, next)) return;

            applyingExternalPrefs.current = true;
            setMode(next.mode);
            setDirection(next.direction);
            setFit(next.fit);
            setGap(next.gap);
            setBg(next.bg);
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
                applyPrefs(toReaderPrefs(settings));
            }),
        [applyPrefs, currentPrefs],
    );

    // Re-clampa a página restaurada quando o total real chega (assíncrono).
    useEffect(() => {
        if (hasRealTotal) setPage(p => Math.min(p, total));
    }, [hasRealTotal, total]);

    // ---------- persist reading position (contrato ReaderProgressGateway) ----------
    useEffect(() => {
        if (!titleId) return;
        readerProgressGateway.saveProgress(titleId, String(chapter), page);
        // Última página alcançada ⇒ capítulo concluído. Só com o total REAL
        // conhecido — o fallback (18) marcaria conclusão falsa.
        if (hasRealTotal && page >= total) readerProgressGateway.markCompleted(titleId, String(chapter));
    }, [titleId, chapter, page, total, hasRealTotal]);

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
            const target = Math.max(1, Math.min(total, n));
            if (mode === 'vertical') {
                const el = listRef.current?.querySelector(`[data-rd-page="${target}"]`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setPage(target);
        },
        [mode, total],
    );

    const switchChapter = useCallback(
        (delta: number) => {
            const next = Math.min(lastChapter ?? Infinity, Math.max(1, chapter + delta));
            if (next === chapter) return;
            setChaptersOpen(false);
            navigate(ROUTES.CHAPTER(titleId ?? '', next));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [chapter, lastChapter, navigate, titleId],
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

    const fillPct = ((page - 1) / Math.max(1, total - 1)) * 100;
    const isEnd = mode !== 'vertical' && page > total;
    const hasNextChapter = lastChapter === undefined || chapter < lastChapter;

    return {
        // route-derived
        chapter,
        hasNextChapter,
        total,
        // prefs
        mode,
        direction,
        fit,
        gap,
        bg,
        setMode,
        setDirection,
        setFit,
        setGap,
        setBg,
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
