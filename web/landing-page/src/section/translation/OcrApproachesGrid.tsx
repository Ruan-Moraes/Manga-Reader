import Icon from '@/shared/component/Icon';
import Reveal from '@/shared/component/Reveal';
import {
    TRANSLATION_APPROACHES_META,
    type TranslationApproachText,
} from '@/shared/data/translation';

interface OcrApproachesGridProps {
    title: string;
    approaches: TranslationApproachText[];
}

export function OcrApproachesGrid({
    title,
    approaches,
}: OcrApproachesGridProps) {
    if (approaches.length === 0) return null;

    return (
        <div className="mt-14">
            <div className="text-center md:text-left">
                <h3 className="m-0 text-base font-extrabold text-fg sm:text-lg">
                    {title}
                </h3>
            </div>
            <ul className="mt-5 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-4">
                {approaches.map((item, index) => {
                    const icon = TRANSLATION_APPROACHES_META[index] ?? 'layers';
                    return (
                        <Reveal key={item.t} as="li" delay={(index % 4) * 50}>
                            <article className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-1 hover:border-accent-muted hover:shadow-md">
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex size-9 items-center justify-center rounded-lg border border-accent-muted bg-accent-subtle text-accent-fg">
                                            <Icon name={icon} size={18} />
                                        </span>
                                        <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-copy-muted">
                                            {item.tag}
                                        </span>
                                    </div>
                                    <h4 className="mt-3.5 mb-1.5 text-sm font-extrabold text-fg sm:text-base">
                                        {item.t}
                                    </h4>
                                    <p className="m-0 text-xs leading-relaxed text-copy-muted sm:text-[13px]">
                                        {item.d}
                                    </p>
                                </div>
                            </article>
                        </Reveal>
                    );
                })}
            </ul>
        </div>
    );
}

export default OcrApproachesGrid;
