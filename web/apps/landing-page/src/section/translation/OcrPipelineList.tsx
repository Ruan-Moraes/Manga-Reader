import Icon from '@/shared/component/Icon';

export interface PipelineStep {
    name: string;
    desc: string;
}

interface OcrPipelineListProps {
    title: string;
    steps: PipelineStep[];
    sourceLabel?: string;
    targetLabel?: string;
}

const SOURCE_LANGUAGES = [
    { code: 'JA', label: '日本語' },
    { code: 'KO', label: '한국어' },
    { code: 'ZH', label: '中文' },
];

const TARGET_LANGUAGES = [
    { code: 'PT', label: 'Português' },
    { code: 'EN', label: 'English' },
    { code: 'ES', label: 'Español' },
];

export function OcrPipelineList({
    title,
    steps,
    sourceLabel = 'Origem',
    targetLabel = 'Destino',
}: OcrPipelineListProps) {
    return (
        <div className="flex flex-col justify-between gap-5">
            <div>
                <h4 className="m-[0_0_8px] text-xs font-black uppercase tracking-[0.14em] text-accent-fg">
                    {title}
                </h4>
                <ol className="m-0 grid list-none gap-2 p-0">
                    {steps.map((step, idx) => (
                        <li
                            key={step.name}
                            className="flex items-center justify-between rounded-lg border border-line-soft bg-surface p-2.5 px-3 text-xs"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-[10px] font-black text-accent-fg">
                                    {idx + 1}
                                </span>
                                <span className="font-extrabold text-fg">
                                    {step.name}
                                </span>
                            </div>
                            <span className="text-[11px] text-copy-muted">
                                {step.desc}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* Chips de idiomas de origem e destino */}
            <div className="rounded-xl border border-border bg-surface-muted p-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-copy">
                    <span>{sourceLabel}</span>
                    <Icon name="arrowR" size={14} className="text-accent-fg" />
                    <span>{targetLabel}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                        {SOURCE_LANGUAGES.map(l => (
                            <span
                                key={l.code}
                                className="rounded bg-surface px-2 py-0.5 text-[11px] font-bold text-fg"
                            >
                                {l.code}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                        {TARGET_LANGUAGES.map(l => (
                            <span
                                key={l.code}
                                className="rounded border border-accent-muted bg-accent-subtle px-2 py-0.5 text-[11px] font-black text-accent-fg"
                            >
                                {l.code}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OcrPipelineList;
