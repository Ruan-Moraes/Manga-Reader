import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import type { TranslationExampleText } from '@/shared/data/translation';
import { OcrFormatTabs } from './OcrFormatTabs';
import { OcrFramePreview } from './OcrFramePreview';
import { OcrModeToggle, type OcrViewMode } from './OcrModeToggle';
import { OcrPipelineList, type PipelineStep } from './OcrPipelineList';

interface OcrSimulatorProps {
    examples: TranslationExampleText[];
    currentExample: TranslationExampleText;
    selectedExampleId: string;
    onSelectExample: (id: string) => void;
    mode: OcrViewMode;
    onModeChange: (mode: OcrViewMode) => void;
    pipelineSteps: PipelineStep[];
}

export function OcrSimulator({
    examples,
    currentExample,
    selectedExampleId,
    onSelectExample,
    mode,
    onModeChange,
    pipelineSteps,
}: OcrSimulatorProps) {
    const { t } = useTranslation();

    return (
        <div className="mx-auto max-w-[960px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgb(0_0_0_/_22%)]">
            {/* Seletor de Estilo/Formato de Obra */}
            <OcrFormatTabs
                examples={examples}
                selectedId={selectedExampleId}
                onSelect={onSelectExample}
                title={t('translation.examplesTitle')}
            />

            {/* Header do Card com seletor de idiomas e toggle de visualização */}
            <div className="flex flex-col gap-4 border-b border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-lg border border-accent-muted bg-accent-subtle text-accent-fg">
                        <Icon name="languages" size={20} />
                    </span>
                    <div>
                        <h3 className="m-0 text-sm font-extrabold text-fg sm:text-base">
                            {t('translation.preview.cardLabel')}
                        </h3>
                        <p className="m-0 text-xs text-copy-muted">
                            {currentExample.character} ·{' '}
                            <span className="text-tertiary">
                                {currentExample.category}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Botões de alternância Original / Inpainting / Traduzido */}
                <OcrModeToggle
                    mode={mode}
                    onModeChange={onModeChange}
                    ariaLabel={t('translation.preview.cardLabel')}
                    originalLabel={t('translation.preview.toggleOriginal')}
                    cleanedLabel={t('translation.preview.toggleCleaned')}
                    translatedLabel={t('translation.preview.toggleTranslated')}
                />
            </div>

            {/* Área da Vinheta / Simulação Visual */}
            <div className="grid gap-6 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-8">
                {/* Simulação do painel da obra */}
                <OcrFramePreview mode={mode} example={currentExample} />

                {/* Painel lateral de suporte: Pares e Pipeline */}
                <OcrPipelineList
                    title={t('translation.pipeline.title')}
                    steps={pipelineSteps}
                />
            </div>
        </div>
    );
}

export default OcrSimulator;
