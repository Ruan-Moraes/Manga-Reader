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
            style={{
                position: 'relative',
                width: w,
                aspectRatio: '2 / 3',
                borderRadius: 4,
                overflow: 'hidden',
                background: m.gradient,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 7,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.4em',
                    fontWeight: 800,
                    color: 'rgba(221,218,42,0.30)',
                    letterSpacing: 1,
                }}
            >
                {m.initial}
            </div>
            <div
                style={{
                    position: 'absolute',
                    top: 5,
                    left: 5,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    background: 'rgba(22,22,22,0.7)',
                    color: '#ddda2a',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 2,
                    border: '1px solid rgba(221,218,42,0.3)',
                }}
            >
                ★ {m.rating}
            </div>
            {tag && (
                <div
                    style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        background: '#ddda2a',
                        color: '#161616',
                        fontSize: 8,
                        fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: 2,
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                    }}
                >
                    {tag}
                </div>
            )}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '60%',
                    background:
                        'linear-gradient(180deg, transparent, rgba(22,22,22,0.95))',
                }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#fff',
                        lineHeight: 1.2,
                        textShadow: '0 1px 2px rgba(0,0,0,.8)',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {m.title}
                </div>
                {showProgress && (
                    <div
                        style={{
                            marginTop: 5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                height: 3,
                                background: 'rgba(255,255,255,.18)',
                                borderRadius: 2,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    background: '#ddda2a',
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: 8,
                                color: '#ddda2a',
                                fontWeight: 700,
                            }}
                        >
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
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 36,
                padding: '0 12px',
                borderRadius: 2,
                background: '#161616',
                border: '1px solid #444',
                color: '#727273',
            }}
        >
            <Icon name="search" size={15} />
            <span style={{ fontSize: 12, letterSpacing: '.0625rem' }}>
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
        <div
            style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                margin: '0 0 11px',
            }}
        >
            <h4
                style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '.0625rem',
                }}
            >
                {children}
            </h4>
            {action && (
                <span
                    style={{ fontSize: 11, fontWeight: 700, color: '#ddda2a' }}
                >
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
        <div
            className="lp-screen"
            style={{
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <MockSearch ui={ui} />
            <div>
                <ScreenHeader action="→">{ui.continueReading}</ScreenHeader>
                <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
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
            <div style={{ minHeight: 0, flex: 1 }}>
                <ScreenHeader action="→">{ui.forYou}</ScreenHeader>
                <div className="lp-poster-grid">
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
        <div
            style={{
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', gap: 16 }}>
                <MiniPoster m={m} w={120} />
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '.0625rem',
                        }}
                    >
                        {m.title}
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#ddda2a',
                            fontWeight: 700,
                            fontSize: 13,
                        }}
                    >
                        <RatingStars value={5} size={13} /> {m.rating}
                        <span style={{ color: '#727273', fontWeight: 600 }}>
                            · {m.ch} {ui.chapters}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {genres.map(g => (
                            <span
                                key={g}
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#cccccc',
                                    background: '#2d2d2d',
                                    border: '1px solid #444',
                                    borderRadius: 999,
                                    padding: '3px 9px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '.06em',
                                }}
                            >
                                {g}
                            </span>
                        ))}
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            color: '#999',
                            lineHeight: 1.55,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {mock.synopsis}
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                height: 34,
                                padding: '0 16px',
                                borderRadius: 2,
                                background: '#ddda2a',
                                color: '#161616',
                                fontWeight: 800,
                                fontSize: 12,
                                letterSpacing: '.0625rem',
                            }}
                        >
                            <Icon name="play" size={13} /> {ui.readNow}
                        </span>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 34,
                                height: 34,
                                borderRadius: 2,
                                background: 'transparent',
                                color: '#ddda2a',
                                border: '1px solid #444',
                            }}
                        >
                            <Icon name="bookmark" size={15} />
                        </span>
                    </div>
                </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <ScreenHeader>{chaptersLabel}</ScreenHeader>
                <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 7 }}
                >
                    {chapters.map((c, i) => (
                        <div
                            key={c}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '9px 12px',
                                borderRadius: 4,
                                background:
                                    i === 0
                                        ? 'rgba(221,218,42,0.08)'
                                        : '#161616',
                                border: `1px solid ${i === 0 ? 'rgba(221,218,42,0.35)' : '#2d2d2d'}`,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: i === 0 ? 700 : 600,
                                    color: i === 0 ? '#ddda2a' : '#fff',
                                }}
                            >
                                {ui.chapter} {c}
                            </span>
                            <span style={{ fontSize: 10, color: '#727273' }}>
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
        el.scrollTop = drag.current.startTop - (e.clientY - drag.current.startY);
    };

    const endDrag = (e: PointerEvent<HTMLDivElement>) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        const el = scrollRef.current;
        el?.releasePointerCapture(e.pointerId);
        if (el) el.style.cursor = 'grab';
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#0e0e0e',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderBottom: '1px solid #202020',
                    background: '#121212',
                }}
            >
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,.06)',
                        color: '#cfcfcf',
                    }}
                >
                    <Icon
                        name="chevronD"
                        size={15}
                        style={{ transform: 'rotate(90deg)' }}
                    />
                </span>
                <span
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        lineHeight: 1.2,
                    }}
                >
                    <span
                        style={{
                            color: '#fff',
                            fontSize: 12.5,
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {m.title}
                    </span>
                    <span
                        style={{
                            color: '#8a8a8a',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                    >
                        {ui.chapter} 140
                    </span>
                </span>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        color: '#9a9a9a',
                    }}
                >
                    <Icon name="menu" size={16} />
                </span>
            </div>
            <div
                ref={scrollRef}
                className="lp-reader-scroll"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'grab',
                    touchAction: 'none',
                    userSelect: 'none',
                }}
            >
                {MANGA_STORY.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        loading={i === 0 ? 'eager' : 'lazy'}
                        draggable={false}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                        }}
                    />
                ))}
            </div>
            <div
                style={{
                    padding: '10px 16px',
                    borderTop: '1px solid #2d2d2d',
                    background: '#161616',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        color: '#727273',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {ui.page} 14 {ui.of} 32
                </span>
                <div
                    style={{
                        flex: 1,
                        height: 4,
                        background: '#2d2d2d',
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: '44%',
                            height: '100%',
                            background: '#ddda2a',
                        }}
                    />
                </div>
                <span
                    style={{ display: 'inline-flex', gap: 8, color: '#cccccc' }}
                >
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
        <div
            className="lp-screen"
            style={{
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background: '#ddda2a',
                        color: '#161616',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 22,
                    }}
                >
                    RM
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '.0625rem',
                        }}
                    >
                        {mock.profileName}
                    </div>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#ddda2a',
                            background: 'rgba(221,218,42,0.12)',
                            border: '1px solid rgba(221,218,42,0.4)',
                            borderRadius: 999,
                            padding: '2px 9px',
                        }}
                    >
                        <Icon name="sync" size={12} /> {ui.synced}
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                {stats.map(([v, l]) => (
                    <div
                        key={l}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: 4,
                            background: '#161616',
                            border: '1px solid #2d2d2d',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: '#ddda2a',
                            }}
                        >
                            {v}
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                color: '#999',
                                textTransform: 'uppercase',
                                letterSpacing: '.06em',
                                fontWeight: 700,
                            }}
                        >
                            {l}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
                {tabs.map((tb, i) => (
                    <span
                        key={tb}
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '6px 12px',
                            borderRadius: 999,
                            whiteSpace: 'nowrap',
                            color: i === 0 ? '#161616' : '#cccccc',
                            background: i === 0 ? '#ddda2a' : '#2d2d2d',
                            border: `1px solid ${i === 0 ? '#ddda2a' : '#444'}`,
                        }}
                    >
                        {tb}
                    </span>
                ))}
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <div className="lp-poster-grid">
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
