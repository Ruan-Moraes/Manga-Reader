import type { IconName } from '@/shared/component/Icon';

/** Ícones dos recursos de tradução — texto vem de `translation.features` na mesma ordem. */
export const TRANSLATION_FEATURES_META: IconName[] = [
    'eye',
    'sparkles',
    'layers',
    'wifiOff',
];

/** Ícones das abordagens de OCR — texto vem de `translation.approaches` na mesma ordem. */
export const TRANSLATION_APPROACHES_META: IconName[] = [
    'layers',
    'globe',
    'shield',
    'zap',
];

export interface TranslationFeatureText {
    t: string;
    d: string;
}

export interface TranslationApproachText {
    tag: string;
    t: string;
    d: string;
}

export interface TranslationExampleText {
    id: string;
    label: string;
    category: string;
    orientation: string;
    character: string;
    sourceLang: string;
    targetLang: string;
    originalBubble: string;
    cleanedNote: string;
    translatedBubble: string;
    detectionType: string;
    confidence: string;
}
