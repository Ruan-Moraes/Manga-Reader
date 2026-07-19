import { AppleGlyph, PlayGlyph } from '@/shared/component/Icon';

interface StoreBadgeProps {
    kind: 'apple' | 'play';
    line1: string;
    line2: string;
    href?: string;
}

export default function StoreBadge({
    kind,
    line1,
    line2,
    href,
}: StoreBadgeProps) {
    const content = (
        <>
            {kind === 'apple' ? (
                <AppleGlyph size={24} />
            ) : (
                <PlayGlyph size={24} />
            )}
            <span className="flex flex-col leading-[1.05] [&>span]:text-[0.6875rem] [&>span]:font-semibold [&>span]:tracking-[0.04em] [&>span]:text-copy [&>strong]:text-base [&>strong]:tracking-[0.03em]">
                <span>{line1}</span>
                <strong>{line2}</strong>
            </span>
        </>
    );

    if (href) {
        return (
            <a
                className="inline-flex min-h-14 cursor-pointer items-center gap-[11px] rounded-lg border border-line bg-secondary px-[18px] text-fg no-underline shadow-[-4px_4px_0_rgb(221_218_42_/_18%)] transition-[border-color,background-color,translate,scale,box-shadow] duration-[180ms] hover:-translate-y-0.5 hover:border-accent-muted hover:bg-surface-hover hover:shadow-[-5px_6px_0_rgb(221_218_42_/_26%)] active:translate-y-0 active:scale-[0.985]"
                href={href}
            >
                {content}
            </a>
        );
    }

    return (
        <span
            className="inline-flex min-h-14 cursor-default items-center gap-[11px] rounded-lg border border-line bg-secondary px-[18px] text-fg shadow-[-4px_4px_0_rgb(221_218_42_/_18%)]"
            aria-disabled="true"
        >
            {content}
        </span>
    );
}
