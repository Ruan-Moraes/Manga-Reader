import type { CSSProperties, ReactNode } from 'react';

import Icon from '@/shared/component/Icon';

/* Janela de navegador minimalista, on-brand (chrome escuro) */
export function BrowserFrame({
    children,
    url = 'app.mangareader.com',
    style,
    glow = true,
}: {
    children: ReactNode;
    url?: string;
    style?: CSSProperties;
    glow?: boolean;
}) {
    return (
        <div
            style={{
                borderRadius: 12,
                overflow: 'hidden',
                background: '#161616',
                border: '1px solid #444',
                boxShadow: glow
                    ? '0 0 0 1px rgba(221,218,42,0.10), -0.5rem 0.75rem 0 0 rgba(221,218,42,0.18), 0 30px 80px rgba(0,0,0,0.55)'
                    : 'none',
                ...style,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    background: '#0e0e0e',
                    borderBottom: '1px solid #2d2d2d',
                }}
            >
                <div style={{ display: 'flex', gap: 6 }}>
                    {['#FF784F', '#ddda2a', '#3a3a3a'].map((c, i) => (
                        <span
                            key={c}
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: c,
                                opacity: i === 2 ? 0.6 : 0.9,
                            }}
                        />
                    ))}
                </div>
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        height: 24,
                        padding: '0 12px',
                        background: '#161616',
                        border: '1px solid #2d2d2d',
                        borderRadius: 999,
                        color: '#727273',
                        fontSize: 11,
                        letterSpacing: '.0625rem',
                    }}
                >
                    <Icon name="lock" size={11} stroke={2.4} />
                    {url}
                </div>
            </div>
            <div style={{ position: 'relative' }}>{children}</div>
        </div>
    );
}

/* Moldura de celular */
export function PhoneFrame({
    children,
    w = 230,
    style,
    glow = true,
    label,
}: {
    children: ReactNode;
    w?: number;
    style?: CSSProperties;
    glow?: boolean;
    label?: string;
}) {
    const h = w * 2.05;

    const now = new Date();

    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return (
        <div
            style={{
                width: w,
                height: h,
                borderRadius: w * 0.16,
                padding: 9,
                background: '#000',
                border: '1px solid #333',
                boxShadow: glow
                    ? '-0.5rem 0.75rem 0 0 rgba(221,218,42,0.18), 0 30px 70px rgba(0,0,0,0.6)'
                    : '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative',
                ...style,
            }}
            aria-label={label}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: w * 0.115,
                    overflow: 'hidden',
                    background: '#161616',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: -1,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 5,
                        width: w * 0.42,
                        height: w * 0.075,
                        background: '#000',
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 7.5,
                        padding: '2.5px 12px',
                        fontWeight: 700,
                        color: '#fff',
                    }}
                >
                    <span style={{ paddingLeft: '5px' }}>{timeString}</span>
                    <span
                        style={{
                            display: 'inline-flex',
                            gap: 4,
                            alignItems: 'center',
                            opacity: 0.85,
                        }}
                    >
                        <span>5G</span>
                        <span
                            style={{
                                width: 18,
                                height: 9,
                                border: '1px solid #fff',
                                borderRadius: 2,
                                display: 'inline-block',
                                position: 'relative',
                            }}
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    inset: 1,
                                    right: 5,
                                    background: '#ddda2a',
                                    borderRadius: 1,
                                }}
                            />
                        </span>
                    </span>
                </div>
                <div
                    style={{ height: 'calc(100% - 32px)', overflow: 'hidden' }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
