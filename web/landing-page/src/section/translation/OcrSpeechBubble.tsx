import Icon from '@/shared/component/Icon';
import type { TranslationExampleText } from '@/shared/data/translation';
import type { OcrViewMode } from './OcrModeToggle';

interface OcrSpeechBubbleProps {
    mode: OcrViewMode;
    example: TranslationExampleText;
    cleanedStatusText: string;
}

export function OcrSpeechBubble({
    mode,
    example,
    cleanedStatusText,
}: OcrSpeechBubbleProps) {
    if (mode === 'original') {
        return (
            <div className="relative max-w-[360px] rounded-3xl border-2 border-dashed border-accent bg-surface-elevated p-5 text-center shadow-lg transition-all duration-200">
                <span className="absolute -top-3 left-4 rounded-sm bg-accent px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-on-accent">
                    OCR Polygon
                </span>
                <span className="absolute -top-3 right-4 rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[9px] font-bold text-copy-muted">
                    {example.orientation}
                </span>
                <p className="m-0 font-serif text-lg font-bold leading-snug tracking-wider text-fg">
                    {example.originalBubble}
                </p>
                <div
                    className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-surface-elevated"
                    aria-hidden="true"
                />
            </div>
        );
    }

    if (mode === 'cleaned') {
        return (
            <div className="relative max-w-[360px] rounded-3xl border border-dashed border-accent-muted bg-surface-muted/70 p-5 text-center shadow-inner transition-all duration-200">
                <div className="py-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-muted bg-accent-subtle px-2.5 py-0.5 text-[10px] font-bold text-accent-fg">
                        <Icon name="check" size={12} />
                        {cleanedStatusText}
                    </span>
                    <p className="mt-2 text-xs italic text-copy-muted">
                        {example.cleanedNote}
                    </p>
                </div>
                <div
                    className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 border-r border-b border-dashed border-accent-muted bg-surface-muted/70"
                    aria-hidden="true"
                />
            </div>
        );
    }

    return (
        <div className="relative max-w-[360px] rounded-3xl border border-border bg-white p-5 text-center text-gray-900 shadow-[0_6px_20px_rgb(0_0_0_/_16%)] transition-all duration-200">
            <p className="m-0 text-sm font-extrabold leading-snug text-neutral-900 sm:text-base">
                {example.translatedBubble}
            </p>
            <div
                className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white"
                aria-hidden="true"
            />
        </div>
    );
}

export default OcrSpeechBubble;
