import type { CatalogItem } from '@/shared/data/landing';

export interface MiniPosterProps {
    m: CatalogItem;
    w: number | string;
    showProgress?: boolean;
    progress?: number;
    tag?: string;
}

export function MiniPoster({
    m,
    w,
    showProgress,
    progress,
    tag,
}: MiniPosterProps) {
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

export default MiniPoster;
