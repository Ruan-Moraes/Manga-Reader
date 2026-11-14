import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import type { TranslationExampleText } from '@/shared/data/translation';
import { type OcrViewMode } from './OcrModeToggle';
import { OcrSpeechBubble } from './OcrSpeechBubble';

interface OcrFramePreviewProps {
    mode: OcrViewMode;
    example: TranslationExampleText;
}

export function OcrFramePreview({ mode, example }: OcrFramePreviewProps) {
    const { t } = useTranslation();

    const currentLangLabel =
        mode === 'original'
            ? example.sourceLang
            : mode === 'cleaned'
              ? t('translation.preview.statusCleaned')
              : example.targetLang;

    const currentDetectionLabel =
        mode === 'original'
            ? example.detectionType
            : mode === 'cleaned'
              ? 'Inpainting'
              : 'Auto-Fit Noto Sans';

    const currentStatusLabel =
        mode === 'original'
            ? t('translation.preview.statusOcr')
            : mode === 'cleaned'
              ? t('translation.preview.statusCleaned')
              : t('translation.preview.statusRendered');

    const currentConfidenceLabel =
        mode === 'original'
            ? example.confidence
            : t('translation.preview.statusTranslated');

    return (
        <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-xl border border-line-soft bg-surface-deep p-6">
            <div className="flex items-center justify-between text-xs text-copy-muted">
                <span className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase text-accent-fg">
                    <span className="size-2 rounded-full bg-accent" />
                    {currentLangLabel}
                </span>
                <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-semibold text-tertiary">
                    {currentDetectionLabel}
                </span>
            </div>

            {/* Balão de fala ilustrativo conforme o modo */}
            <div className="my-6 flex justify-center">
                <OcrSpeechBubble
                    mode={mode}
                    example={example}
                    cleanedStatusText={t('translation.preview.statusCleaned')}
                />
            </div>

            {/* Status de processamento do frame */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[11px]">
                <span className="font-medium text-copy-muted">
                    {currentStatusLabel}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-accent-fg">
                    <Icon name="check" size={13} />
                    {currentConfidenceLabel}
                </span>
            </div>
        </div>
    );
}

export default OcrFramePreview;
