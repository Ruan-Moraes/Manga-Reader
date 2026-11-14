import Icon from '@/shared/component/Icon';

export type OcrViewMode = 'original' | 'cleaned' | 'translated';

interface OcrModeToggleProps {
    mode: OcrViewMode;
    onModeChange: (mode: OcrViewMode) => void;
    ariaLabel: string;
    originalLabel: string;
    cleanedLabel: string;
    translatedLabel: string;
}

export function OcrModeToggle({
    mode,
    onModeChange,
    ariaLabel,
    originalLabel,
    cleanedLabel,
    translatedLabel,
}: OcrModeToggleProps) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className="inline-flex self-start rounded-lg border border-border bg-surface p-1 sm:self-auto"
        >
            <button
                type="button"
                onClick={() => onModeChange('original')}
                className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-bold transition-[background-color,color] ${
                    mode === 'original'
                        ? 'bg-accent text-on-accent shadow-xs'
                        : 'text-copy hover:text-fg'
                }`}
                aria-pressed={mode === 'original'}
            >
                {originalLabel}
            </button>
            <button
                type="button"
                onClick={() => onModeChange('cleaned')}
                className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-bold transition-[background-color,color] ${
                    mode === 'cleaned'
                        ? 'bg-accent text-on-accent shadow-xs'
                        : 'text-copy hover:text-fg'
                }`}
                aria-pressed={mode === 'cleaned'}
            >
                {cleanedLabel}
            </button>
            <button
                type="button"
                onClick={() => onModeChange('translated')}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-[background-color,color] ${
                    mode === 'translated'
                        ? 'bg-accent text-on-accent shadow-xs'
                        : 'text-copy hover:text-fg'
                }`}
                aria-pressed={mode === 'translated'}
            >
                <Icon name="sparkles" size={12} />
                {translatedLabel}
            </button>
        </div>
    );
}

export default OcrModeToggle;
