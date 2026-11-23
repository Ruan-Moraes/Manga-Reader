import type { TranslationExampleText } from '@/shared/data/translation';

interface OcrFormatTabsProps {
    examples: TranslationExampleText[];
    selectedId: string;
    onSelect: (id: string) => void;
    title: string;
}

export function OcrFormatTabs({
    examples,
    selectedId,
    onSelect,
    title,
}: OcrFormatTabsProps) {
    if (examples.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-deep/80 px-4 py-3 sm:px-6">
            <span className="text-xs font-bold uppercase tracking-wider text-copy-muted">
                {title}:
            </span>
            <div
                role="tablist"
                aria-label={title}
                className="flex flex-wrap gap-1.5"
            >
                {examples.map(ex => {
                    const isSelected = selectedId === ex.id;
                    return (
                        <button
                            key={ex.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => onSelect(ex.id)}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                isSelected
                                    ? 'bg-accent text-on-accent shadow-xs'
                                    : 'bg-surface text-copy hover:bg-surface-elevated hover:text-fg'
                            }`}
                        >
                            {ex.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default OcrFormatTabs;
