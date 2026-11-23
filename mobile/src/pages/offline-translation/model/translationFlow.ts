import { isMediaValidationReady, type LocalMediaImportDraft } from '@/entities/local-media-import';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/shared/media-inspection';

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

/** Visible stages of the redesigned flow (056): the five persisted sub-steps grouped in three screens. */
export const TRANSLATION_FLOW_STAGES = ['pages', 'languages', 'translate'] as const;
export type TranslationFlowStage = (typeof TRANSLATION_FLOW_STAGES)[number];

export function translationFlowStage(step: TranslationFlowStep): TranslationFlowStage {
    if (step === 'import' || step === 'organize') return 'pages';
    if (step === 'languages' || step === 'validate') return 'languages';
    return 'translate';
}

/**
 * Where "back" goes: the previous screen, never skipping a confirmation; `null` leaves the flow. The pages screen is
 * the first one once images exist (2026-11-10): back from it leaves, asking to keep or discard the draft, instead of
 * showing the old "N images imported · Replace" card.
 */
export function previousTranslationFlowStep(step: TranslationFlowStep): TranslationFlowStep | null {
    if (step === 'review') return 'validate';
    if (step === 'languages' || step === 'validate') return 'organize';
    return null;
}
