import Icon from '@/shared/component/Icon';
import { CATALOG } from '@/shared/data/catalog';
import { MANGA_STORY } from '@/shared/data/mangaStory';
import { useLandingText } from './shared';
import { useDragScroll } from './useDragScroll';

export function ReaderScreen() {
    const { ui } = useLandingText();
    const m = CATALOG[1];
    const { scrollRef, pointerEvents } = useDragScroll<HTMLDivElement>();

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
                {...pointerEvents}
            >
                {MANGA_STORY.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        width={300}
                        height={450}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        draggable={false}
                        className="block aspect-[2/3] h-auto w-full"
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

export default ReaderScreen;
