import type { ReactNode } from 'react';

const PATHS = {
    library: (
        <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </>
    ),
    hd: <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />,
    wifiOff: (
        <>
            <path d="M1 1l22 22" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <path d="M12 20h.01" />
        </>
    ),
    sync: (
        <>
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
        </>
    ),
    devices: (
        <>
            <rect x="2" y="4" width="14" height="11" rx="2" />
            <path d="M2 19h11" />
            <rect x="16" y="9" width="6" height="11" rx="1.5" />
        </>
    ),
    noAds: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M4.9 4.9l14.2 14.2" />
        </>
    ),
    heart: (
        <path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.79 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
    download: (
        <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
        </>
    ),
    smartphone: (
        <>
            <rect x="5" y="2" width="14" height="20" rx="2.5" />
            <path d="M12 18h.01" />
        </>
    ),
    layers: (
        <>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </>
    ),
    users: (
        <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    globe: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </>
    ),
    star: (
        <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />
    ),
    check: <path d="m5 13 4 4L19 7" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    chevronD: <path d="m6 9 6 6 6-6" />,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    arrowR: (
        <>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </>
    ),
    play: <polygon points="6 3 20 12 6 21 6 3" />,
    monitor: (
        <>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
        </>
    ),
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </>
    ),
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
    gift: (
        <>
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </>
    ),
    ticket: (
        <>
            <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
            <path d="M13 5v2M13 17v2M13 11v2" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
        </>
    ),
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    lock: (
        <>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
    ),
    eye: (
        <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    user: (
        <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </>
    ),
    shield: (
        <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
        </>
    ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

interface IconProps {
    name: IconName;
    size?: number;
    stroke?: number;
    className?: string;
}

export default function Icon({
    name,
    size = 24,
    stroke = 2,
    className,
}: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {PATHS[name]}
        </svg>
    );
}

export function AppleGlyph({ size = 22 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M16.36 1.43c.05 1.04-.36 2.06-1.02 2.8-.7.79-1.85 1.4-2.96 1.31-.07-1.02.42-2.07 1.03-2.74.69-.78 1.9-1.36 2.95-1.37zM20.5 17.2c-.55 1.28-.82 1.85-1.53 2.98-.99 1.58-2.39 3.54-4.12 3.55-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.01-3.06-1.78-4.05-3.36C-.07 16.51-.36 11.4 1.46 8.7c1.3-1.93 3.34-3.06 5.27-3.06 1.96 0 3.2 1.07 4.82 1.07 1.58 0 2.54-1.07 4.81-1.07 1.71 0 3.53.93 4.82 2.54-4.24 2.32-3.55 8.37-.68 9.02z" />
        </svg>
    );
}

export function PlayGlyph({ size = 22 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M3.6 2.1c-.3.2-.5.6-.5 1.1v17.6c0 .5.2.9.5 1.1l9.5-9.9z"
                fill="#00d4ff"
            />
            <path
                d="M16.9 8.2 13.1 12l3.8 3.8 4.3-2.4c.9-.5.9-1.8 0-2.3z"
                fill="#ffce00"
            />
            <path d="M3.6 2.1 13.1 12l3.8-3.8z" fill="#00f076" />
            <path d="M3.6 21.9 13.1 12l3.8 3.8z" fill="#ff3d44" />
        </svg>
    );
}

export function RatingStars({
    value = 5,
    size = 14,
}: {
    value?: number;
    size?: number;
}) {
    return (
        <span
            className="inline-flex gap-0.5 text-accent-fg"
            aria-label={`${value} / 5`}
        >
            {[1, 2, 3, 4, 5].map(i => (
                <svg
                    key={i}
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill={i <= value ? '#ddda2a' : '#3a3a1a'}
                    aria-hidden="true"
                >
                    <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />
                </svg>
            ))}
        </span>
    );
}
