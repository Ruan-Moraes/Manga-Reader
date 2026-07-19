import { useRef, type PointerEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Icon, { RatingStars } from '@/shared/component/Icon';

import {
    CATALOG,
    type CatalogItem,
    type LandingMock,
    type LandingUi,
} from '@/shared/data/landing';
import { MANGA_STORY } from '@/shared/data/mangaStory';

/* Pôster compacto reutilizável */
export function MiniPoster({
    m,
    w,
    showProgress,
    progress,
    tag,
}: {
    m: CatalogItem;
    w: number | string;
    showProgress?: boolean;
    progress?: number;
    tag?: string;
}) {
    return (
        <div
            className="relative flex aspect-[2/3] shrink-0 flex-col justify-end overflow-hidden rounded p-[7px]"
            style={{ width: w, background: m.gradient }}
        >
            <div className="absolute inset-0 flex items-center justify-center text-[2.4em] font-extrabold tracking-[1px] text-[rgba(221,218,42,0.30)]">
                {m.initial}
            </div>
            <div className="absolute top-[5px] left-[5px] inline-flex items-center gap-0.5 rounded-sm border border-accent-muted bg-floating px-[5px] py-0.5 text-[9px] font-bold text-accent-fg">
                ★ {m.rating}
            </div>
            {tag && (
                <div className="absolute top-[5px] right-[5px] rounded-sm bg-accent px-[5px] py-0.5 text-[8px] font-extrabold uppercase tracking-[.06em] text-on-accent">
                    {tag}
                </div>
            )}
            <div className="absolute right-0 bottom-0 left-0 h-3/5 bg-[linear-gradient(180deg,transparent,rgba(22,22,22,0.95))]" />
            <div className="relative z-[2]">
                <div className="line-clamp-1 overflow-hidden text-[11px] font-bold leading-[1.2] text-white [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">
                    {m.title}
                </div>
                {showProgress && (
                    <div className="mt-[5px] flex items-center gap-[5px]">
                        <div className="h-[3px] flex-1 overflow-hidden rounded-sm bg-[rgba(255,255,255,.18)]">
                            <div
                                className="h-full bg-accent"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[8px] font-bold text-accent-fg">
                            {progress}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function MockSearch({ ui }: { ui: LandingUi }) {
    return (
        <div className="flex h-9 items-center gap-2 rounded-sm border border-line bg-primary px-3 text-tertiary">
            <Icon name="search" size={15} />
            <span className="text-xs tracking-[.0625rem]">
                {ui.searchPlaceholder}
            </span>
        </div>
    );
}

function ScreenHeader({
    children,
    action,
}: {
    children: ReactNode;
    action?: string;
}) {
    return (
        <div className="mb-[11px] flex items-baseline justify-between">
            <h4 className="m-0 text-sm font-extrabold tracking-[.0625rem] text-fg">
                {children}
            </h4>
            {action && (
                <span className="text-[11px] font-bold text-accent-fg">
                    {action}
                </span>
            )}
        </div>
    );
}

function useLandingText() {
    const { t } = useTranslation();
    const ui = t('ui', { returnObjects: true }) as LandingUi;
    const mock = t('mock', { returnObjects: true }) as LandingMock;
    return { ui, mock };
}

/* ---------- BIBLIOTECA ---------- */
export function LibraryScreen() {
    const { ui } = useLandingText();
    const cont = CATALOG.slice(0, 5);
    const grid = CATALOG.slice(2, 12);
    const progress = [72, 38, 90, 15, 55];

    return (
        <div className="@container flex h-full flex-col gap-[18px] overflow-hidden p-[18px]">
            <MockSearch ui={ui} />
            <div>
                <ScreenHeader action="→">{ui.continueReading}</ScreenHeader>
                <div className="flex gap-2.5 overflow-hidden">
                    {cont.map((m, i) => (
                        <MiniPoster
                            key={m.id}
                            m={m}
                            w={84}
                            showProgress
                            progress={progress[i]}
                        />
                    ))}
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <ScreenHeader action="→">{ui.forYou}</ScreenHeader>
                <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-3 @max-[380px]:grid-cols-3 @max-[380px]:gap-2.5">
                    {grid.map(m => (
                        <MiniPoster key={m.id} m={m} w="100%" tag={m.tag} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- OBRA / TÍTULO ---------- */
export function TitleScreen() {
    const { ui, mock } = useLandingText();
    const m = CATALOG[1];
    const genres = [m.genre, 'Aventura', 'Drama'];
    const chapters = [140, 139, 138, 137, 136];
    const chaptersLabel =
        ui.chapters.charAt(0).toUpperCase() + ui.chapters.slice(1);

    return (
        <div className="flex h-full flex-col gap-4 overflow-hidden p-[18px]">
            <div className="flex gap-4">
                <MiniPoster m={m} w={120} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h3 className="m-0 text-xl font-extrabold tracking-[.0625rem] text-fg">
                        {m.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[13px] font-bold text-accent-fg">
                        <RatingStars value={5} size={13} /> {m.rating}
                        <span className="font-semibold text-tertiary">
                            · {m.ch} {ui.chapters}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {genres.map(g => (
                            <span
                                key={g}
                                className="rounded-full border border-line bg-surface-elevated px-[9px] py-[3px] text-[10px] font-bold uppercase tracking-[.06em] text-copy"
                            >
                                {g}
                            </span>
                        ))}
                    </div>
                    <p className="line-clamp-3 m-0 overflow-hidden text-xs leading-[1.55] text-copy-muted">
                        {mock.synopsis}
                    </p>
                    <div className="mt-0.5 flex gap-2">
                        <span className="inline-flex h-[34px] items-center gap-1.5 rounded-sm bg-accent px-4 text-xs font-extrabold tracking-[.0625rem] text-on-accent">
                            <Icon name="play" size={13} /> {ui.readNow}
                        </span>
                        <span className="inline-flex size-[34px] items-center justify-center rounded-sm border border-line bg-transparent text-accent-fg">
                            <Icon name="bookmark" size={15} />
                        </span>
                    </div>
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <ScreenHeader>{chaptersLabel}</ScreenHeader>
                <div className="flex flex-col gap-[7px]">
                    {chapters.map((c, i) => (
                        <div
                            key={c}
                            className={`flex items-center justify-between rounded p-[9px_12px] ${i === 0 ? 'border border-accent-muted bg-accent-5' : 'border border-line-soft bg-primary'}`}
                        >
                            <span
                                className={`text-xs ${i === 0 ? 'font-bold text-accent-fg' : 'font-semibold text-fg'}`}
                            >
                                {ui.chapter} {c}
                            </span>
                            <span className="text-[10px] text-tertiary">
                                {mock.ago[i]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- LEITOR ---------- */
export function ReaderScreen() {
    const { ui } = useLandingText();

    const m = CATALOG[1];

    const scrollRef = useRef<HTMLDivElement>(null);
    const drag = useRef({ active: false, startY: 0, startTop: 0 });

    const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el) return;
        drag.current = {
            active: true,
            startY: e.clientY,
            startTop: el.scrollTop,
        };
        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el || !drag.current.active) return;
        el.scrollTop =
            drag.current.startTop - (e.clientY - drag.current.startY);
    };

    const endDrag = (e: PointerEvent<HTMLDivElement>) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        const el = scrollRef.current;
        el?.releasePointerCapture(e.pointerId);
        if (el) el.style.cursor = 'grab';
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-surface-deep">
            <div className="flex items-center gap-2.5 border-b border-border bg-surface-muted px-3 py-2">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-copy">
                    <Icon name="chevronD" size={15} className="rotate-90" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-[1.2]">
                    <span className="truncate text-[12.5px] font-bold text-fg">
                        {m.title}
                    </span>
                    <span className="text-[10px] font-semibold text-copy-muted">
                        {ui.chapter} 140
                    </span>
                </span>
                <span className="inline-flex size-7 shrink-0 items-center justify-center text-copy-muted">
                    <Icon name="menu" size={16} />
                </span>
            </div>
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 cursor-grab touch-none select-none overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
            >
                {MANGA_STORY.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        loading={i === 0 ? 'eager' : 'lazy'}
                        draggable={false}
                        className="block h-auto w-full"
                    />
                ))}
            </div>
            <div className="flex items-center gap-3 border-t border-line-soft bg-primary px-4 py-2.5">
                <span className="whitespace-nowrap text-[11px] text-tertiary">
                    {ui.page} 14 {ui.of} 32
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-sm bg-surface-elevated">
                    <div className="h-full w-[44%] bg-accent" />
                </div>
                <span className="inline-flex gap-2 text-copy">
                    <Icon name="bookmark" size={15} />
                    <Icon name="download" size={15} />
                </span>
            </div>
        </div>
    );
}

/* ---------- PERFIL / SINCRONIZAÇÃO ---------- */
export function ProfileScreen() {
    const { ui, mock } = useLandingText();
    const tabs = ui.tabsLib;
    const grid = CATALOG.slice(0, 10);
    const stats: [string, string][] = [
        ['142', mock.statReading],
        ['89', mock.statCompleted],
        ['4.8', mock.statAvg],
    ];

    return (
        <div className="@container flex h-full flex-col gap-4 overflow-hidden p-[18px]">
            <div className="flex items-center gap-3.5">
                <div className="flex size-14 items-center justify-center rounded-sm bg-accent text-[22px] font-extrabold text-on-accent">
                    RM
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-base font-extrabold tracking-[.0625rem] text-fg">
                        {mock.profileName}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-accent-muted bg-accent-subtle px-[9px] py-0.5 text-[11px] font-bold text-accent-fg">
                        <Icon name="sync" size={12} /> {ui.synced}
                    </div>
                </div>
            </div>
            <div className="flex gap-2.5">
                {stats.map(([v, l]) => (
                    <div
                        key={l}
                        className="flex-1 rounded border border-line-soft bg-primary p-[10px_12px]"
                    >
                        <div className="text-lg font-extrabold text-accent-fg">
                            {v}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[.06em] text-copy-muted">
                            {l}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 overflow-hidden">
                {tabs.map((tb, i) => (
                    <span
                        key={tb}
                        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold ${i === 0 ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface-elevated text-copy'}`}
                    >
                        {tb}
                    </span>
                ))}
            </div>
            <div className="min-h-0 flex-1">
                <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-3 @max-[380px]:grid-cols-3 @max-[380px]:gap-2.5">
                    {grid.map(m => (
                        <MiniPoster key={m.id} m={m} w="100%" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export type MockScreenName =
    | 'LibraryScreen'
    | 'TitleScreen'
    | 'ReaderScreen'
    | 'ProfileScreen';

export const MOCK_SCREENS: Record<MockScreenName, () => ReactNode> = {
    LibraryScreen,
    TitleScreen,
    ReaderScreen,
    ProfileScreen,
};
