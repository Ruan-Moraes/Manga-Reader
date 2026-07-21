import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { readStoredUserSettings, subscribeStoredUserSettings, updateMySettings, updateStoredUserSettings, useDebouncedCallback, type UserSettings } from '@entities/user';
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
    quality: UserSettings['reader']['quality'];
    preload: number;
    autoMarkRead: boolean;
}

const toReaderPrefs = (settings: UserSettings): ReaderPrefs => ({
    mode: settings.reader.direction === 'WEBTOON' ? 'vertical' : (settings.reader.mode.toLowerCase() as ReadMode),
    direction: settings.reader.direction === 'LTR' ? 'ltr' : 'rtl',
    fit: settings.reader.fit.toLowerCase() as Fit,
    gap: settings.reader.gap,
    bg: settings.reader.background.toLowerCase() as Bg,
    quality: settings.reader.quality,
    preload: settings.reader.preload,
    autoMarkRead: settings.reader.autoMarkRead,
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
    left.quality === right.quality &&
    left.preload === right.preload &&
    left.autoMarkRead === right.autoMarkRead;

const readPrefs = (): ReaderPrefs => toReaderPrefs(readStoredUserSettings());

export function useChapterReader(
    titleId: string | undefined,
    chapterParam: string | undefined,
    maxChapter?: number,
    totalPages?: number,
    isLoggedIn = false,
) {
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
    const [quality, setQuality] = useState(initialPrefs.quality);
    const [preload, setPreload] = useState(initialPrefs.preload);
    const [autoMarkRead, setAutoMarkRead] = useState(initialPrefs.autoMarkRead);

    // Restauração da posição salva é assíncrona (backend) — parte de 1 e
    // corrige quando a resposta chega (efeito abaixo, roda só no mount).
    const [page, setPage] = useState(1);

    const [topbarHidden, setTopbarHidden] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [chaptersOpen, setChaptersOpen] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);

    const [rating, setRating] = useState(0);

    const listRef = useRef<HTMLDivElement>(null);
    const lastY = useRef(0);
    const didInitPrefs = useRef(false);
    const applyingExternalPrefs = useRef(false);
    // Bloqueia o efeito de salvar até a restauração inicial resolver — evita
    // sobrescrever o progresso salvo com page=1 enquanto o GET está em voo.
    const progressInitialized = useRef(false);
    const latestProgressRef = useRef({ page, total, hasRealTotal });
    const persistSettings = useDebouncedCallback((next: UserSettings) => {
        void updateMySettings(next)
            .then(updateStoredUserSettingsFromServer => {
                updateStoredUserSettings(() => updateStoredUserSettingsFromServer);
            })
            .catch(() => {
                // A cópia local permanece como estado efêmero e será reconciliada no próximo GET.
            });
    }, 400);

    const step = mode === 'double' ? 2 : 1;
    const lastPage = mode === 'vertical' ? total : total + 1;

    const currentPrefs = useMemo<ReaderPrefs>(() => ({ mode, direction, fit, gap, bg, quality, preload, autoMarkRead }), [mode, direction, fit, gap, bg, quality, preload, autoMarkRead]);

    const applyPrefs = useCallback(
        (next: ReaderPrefs) => {
            if (samePrefs(currentPrefs, next)) return;

            applyingExternalPrefs.current = true;
            setMode(next.mode);
            setDirection(next.direction);
            setFit(next.fit);
            setGap(next.gap);
            setBg(next.bg);
            setQuality(next.quality);
            setPreload(next.preload);
            setAutoMarkRead(next.autoMarkRead);
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

        const next = updateStoredUserSettings(current => ({
            ...current,
            reader: {
                ...current.reader,
                mode: toSettingsMode(mode),
                direction: mode === 'vertical' && current.reader.direction === 'WEBTOON' ? 'WEBTOON' : toSettingsDirection(direction),
                fit: toSettingsFit(fit),
                gap,
                background: toSettingsBackground(bg),
                quality,
                preload,
                autoMarkRead,
            },
        }));

        if (isLoggedIn) persistSettings(next);
    }, [currentPrefs, mode, direction, fit, gap, bg, quality, preload, autoMarkRead, isLoggedIn, persistSettings]);

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

    // Mantém os valores mais recentes acessíveis ao flush síncrono do cleanup
    // (evita reler estado React dentro de uma closure potencialmente stale).
    useEffect(() => {
        latestProgressRef.current = { page, total, hasRealTotal };
    }, [page, total, hasRealTotal]);

    // ---------- restore reading position (roda só uma vez, no mount) ----------
    useEffect(() => {
        if (!titleId || !isLoggedIn) {
            progressInitialized.current = true;
            return;
        }

        let cancelled = false;
        readerProgressGateway
            .getProgress(titleId)
            .then(pos => {
                if (cancelled) return;
                if (pos && pos.chapter === chapter && pos.page) {
                    setPage(Math.max(1, pos.page));
                }
            })
            .catch(() => {
                /* ignore — mantém page=1 */
            })
            .finally(() => {
                if (!cancelled) progressInitialized.current = true;
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- restaura só uma vez no mount (mesmo comportamento do initializer síncrono anterior)
    }, []);

    // ---------- persist reading position (contrato ReaderProgressGateway) ----------
    const saveProgressNow = useCallback(
        (p: number, tot: number, completed: boolean) => {
            if (!isLoggedIn || !titleId) return;
            void readerProgressGateway.saveProgress(titleId, String(chapter), p, tot, completed).catch(() => {});
        },
        [isLoggedIn, titleId, chapter],
    );

    const saveProgressDebounced = useDebouncedCallback((p: number, tot: number) => {
        saveProgressNow(p, tot, false);
    }, 800);

    useEffect(() => {
        if (!titleId || !progressInitialized.current) return;

        // Última página alcançada ⇒ capítulo concluído. Só com o total REAL
        // conhecido — o fallback (18) marcaria conclusão falsa. Conclusão
        // dispara imediatamente (sem debounce): é um marco, não pode se perder.
        if (autoMarkRead && hasRealTotal && page >= total) {
            saveProgressNow(page, total, true);
            return;
        }

        saveProgressDebounced(page, total);
    }, [titleId, page, total, hasRealTotal, autoMarkRead, saveProgressNow, saveProgressDebounced]);

    // Flush imediato ao trocar de capítulo/desmontar: evita perder a última
    // posição por causa de um debounce pendente (usa os valores mais
    // recentes via ref, já que o cleanup roda com a closure do capítulo que
    // está terminando).
    useEffect(
        () => () => {
            if (!progressInitialized.current) return;
            const { page: p, total: tot, hasRealTotal: real } = latestProgressRef.current;
            saveProgressNow(p, tot, autoMarkRead && real && p >= tot);
        },
        [titleId, chapter, autoMarkRead, saveProgressNow],
    );

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
        quality,
        preload,
        autoMarkRead,
        setMode,
        setDirection,
        setFit,
        setGap,
        setBg,
        // reading state
        page,
        setPage,
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
