import { isMediaValidationReady, type LocalMediaImportDraft } from '@/src/entities/local-media-import';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/src/shared/media-inspection';

export const TRANSLATION_FLOW_STEPS = ['import', 'organize', 'languages', 'validate', 'review'] as const;
export type TranslationFlowStep = (typeof TRANSLATION_FLOW_STEPS)[number];

export function availableTranslationFlowStep(draft: LocalMediaImportDraft | null): TranslationFlowStep {
    if (!draft) return 'import';
    if (!draft.confirmedAt) return 'organize';
    if (!draft.languagesConfirmedAt) return 'languages';
    if (!isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION)) return 'validate';
    return 'review';
}

export function visibleTranslationFlowStep(available: TranslationFlowStep, requested: TranslationFlowStep | null): TranslationFlowStep {
    if (!requested) return available;
    const availableIndex = TRANSLATION_FLOW_STEPS.indexOf(available);
    const requestedIndex = TRANSLATION_FLOW_STEPS.indexOf(requested);
    return requestedIndex <= availableIndex ? requested : available;
}
