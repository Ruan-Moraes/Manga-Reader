import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@/shared/component/Button';
import Icon from '@/shared/component/Icon';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import Reveal from '@/shared/component/Reveal';
import type {
    TranslationApproachText,
    TranslationExampleText,
    TranslationFeatureText,
} from '@/shared/data/translation';
import { goToSection } from '@/shared/util/smoothScroll';

import { OcrApproachesGrid } from './translation/OcrApproachesGrid';
import type { OcrViewMode } from './translation/OcrModeToggle';
import type { PipelineStep } from './translation/OcrPipelineList';
import { OcrSimulator } from './translation/OcrSimulator';
import { TranslationFeaturesGrid } from './translation/TranslationFeaturesGrid';

export default function Translation() {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage ?? i18n.language;

    const [selectedExampleId, setSelectedExampleId] = useState<string>('manga');
    const [mode, setMode] = useState<OcrViewMode>('translated');

    const examples = useMemo(
        () =>
            (t('translation.examples', {
                returnObjects: true,
            }) || []) as TranslationExampleText[],
        [t],
    );

    const approaches = useMemo(
        () =>
            (t('translation.approaches', {
                returnObjects: true,
            }) || []) as TranslationApproachText[],
        [t],
    );

    const features = useMemo(
        () =>
            t('translation.features', {
                returnObjects: true,
            }) as TranslationFeatureText[],
        [t],
    );

    const pipelineSteps = useMemo(
        () =>
            t('translation.pipeline.steps', {
                returnObjects: true,
            }) as PipelineStep[],
        [t],
    );

    const currentExample =
        examples.find(e => e.id === selectedExampleId) ??
        examples[0] ?? {
            id: 'manga',
            label: 'Mangá (JA)',
            category: 'Mangá Shounen · Japonês',
            orientation: 'Vertical (Tategaki)',
            character: t('translation.preview.character'),
            sourceLang: t('translation.preview.sourceLang'),
            targetLang: t('translation.preview.targetLang'),
            originalBubble: t('translation.preview.originalBubble'),
            cleanedNote: 'Inpainting',
            translatedBubble: t('translation.preview.translatedBubble'),
            detectionType: 'Balão de Ação · Polígono 4 Vértices',
            confidence: '99.8% Confiança',
        };

    return (
        <MarketingSection key={locale} id="translation" tone="raised">
            <SectionHeading
                eyebrow={t('translation.eyebrow')}
                title={t('translation.title')}
                description={t('translation.sub')}
            />

            {/* Badges de pares de idiomas */}
            <Reveal delay={60} className="mt-7 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-muted bg-accent-subtle px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-accent-fg">
                    <Icon name="sparkles" size={13} />
                    {t('translation.badge')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-semibold text-copy-muted">
                    <Icon name="languages" size={14} className="text-accent-fg" />
                    {t('translation.languagePairs')}
                </span>
            </Reveal>

            {/* Showcase Interativo de Tradução */}
            <Reveal delay={120} y={24} className="mt-9">
                <OcrSimulator
                    examples={examples}
                    currentExample={currentExample}
                    selectedExampleId={selectedExampleId}
                    onSelectExample={setSelectedExampleId}
                    mode={mode}
                    onModeChange={setMode}
                    pipelineSteps={pipelineSteps}
                />
            </Reveal>

            {/* Abordagens Tecnológicas do Nosso OCR */}
            <OcrApproachesGrid
                title={t('translation.approachesTitle')}
                approaches={approaches}
            />

            {/* Grid dos 4 Pilares da Tecnologia */}
            <TranslationFeaturesGrid features={features} />

            {/* Ação rápida / Rodapé da seção */}
            <Reveal delay={160} className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button
                    size="md"
                    variant="primary"
                    iconAfter={<Icon name="arrowR" size={16} />}
                    onClick={() => goToSection('demo')}
                >
                    {t('cta.demo')}
                </Button>
                <Button
                    size="md"
                    variant="outline"
                    onClick={() => goToSection('plans')}
                >
                    {t('cta.subscribe')}
                </Button>
            </Reveal>
        </MarketingSection>
    );
}
