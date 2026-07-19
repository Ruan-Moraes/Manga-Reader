import type { CSSProperties, ReactNode } from 'react';

import Icon from '@/shared/component/Icon';

type FrameStyle = CSSProperties & {
    '--phone-width'?: string;
};

export function BrowserFrame({
    children,
    url = 'app.mangareader.com',
    className = '',
    label = 'Manga Reader no navegador',
}: {
    children: ReactNode;
    url?: string;
    className?: string;
    label?: string;
}) {
    return (
        <div
            className={`overflow-hidden rounded-2xl border border-border-strong bg-primary shadow-[0_0_0_1px_rgb(221_218_42_/_8%),-8px_12px_0_rgb(221_218_42_/_14%),var(--shadow-floating)] ${className}`}
            role="img"
            aria-label={label}
        >
            <div aria-hidden="true">
                <div className="flex min-h-10 items-center gap-2.5 border-b border-border bg-surface-deep px-3.5 py-2">
                    <div className="flex gap-1.5 [&>span]:size-[9px] [&>span]:rounded-full [&>span]:bg-border-strong [&>span:first-child]:bg-[#ff784f] [&>span:nth-child(2)]:bg-accent">
                        <span />
                        <span />
                        <span />
                    </div>
                    <div className="flex h-6 flex-1 items-center gap-[7px] rounded-full border border-border bg-primary px-3 text-[0.6875rem] text-tertiary">
                        <Icon name="lock" size={11} stroke={2.4} />
                        {url}
                    </div>
                </div>
                <div className="relative">{children}</div>
            </div>
        </div>
    );
}

export function PhoneFrame({
    children,
    w = 230,
    className = '',
    label = 'Manga Reader no celular',
}: {
    children: ReactNode;
    w?: number;
    className?: string;
    label?: string;
}) {
    const style: FrameStyle = { '--phone-width': `${w}px` };

    return (
        <div
            className={`aspect-[1/2.05] w-[min(var(--phone-width),60vw)] shrink-0 overflow-hidden rounded-[var(--phone-radius)] border border-[#383838] bg-[#050505] p-[var(--phone-bezel)] shadow-[-8px_12px_0_rgb(221_218_42_/_14%),0_28px_60px_rgb(0_0_0_/_55%)] [--phone-bezel:8px] [--phone-radius:clamp(28px,8vw,36px)] [--phone-screen-radius:calc(var(--phone-radius)-var(--phone-bezel))] ${className}`}
            style={style}
            role="img"
            aria-label={label}
        >
            <div
                className="relative size-full overflow-hidden rounded-[var(--phone-screen-radius)] bg-primary"
                aria-hidden="true"
            >
                <span className="absolute top-0 left-1/2 z-[5] h-[3.8%] w-[42%] -translate-x-1/2 rounded-b-[10px] bg-[#050505]" />
                <div className="flex h-[4.5%] items-center justify-between px-[8%] text-[clamp(5px,1.3vw,8px)] font-extrabold text-white">
                    <span>9:41</span>
                    <span>5G&nbsp; ▰</span>
                </div>
                <div className="h-[95.5%] overflow-hidden rounded-b-[var(--phone-screen-radius)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
