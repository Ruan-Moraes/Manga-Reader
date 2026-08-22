import { type LocalMediaImportDraft, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/src/shared/media-inspection';

import { availableTranslationFlowStep, visibleTranslationFlowStep } from '../translationFlow';

const base: LocalMediaImportDraft = {
    id: 'draft',
    createdAt: 1,
    updatedAt: 1,
    confirmedAt: null,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: null,
    items: [{ ...PENDING_MEDIA_VALIDATION, id: 'page', position: 0, localFilename: 'page', byteSize: 10, mimeHint: null, createdAt: 1 }],
};

describe('translation flow', () => {
    it('derives all five steps from persisted truth', () => {
        expect(availableTranslationFlowStep(null)).toBe('import');
        expect(availableTranslationFlowStep(base)).toBe('organize');
        expect(availableTranslationFlowStep({ ...base, confirmedAt: 2 })).toBe('languages');
        expect(availableTranslationFlowStep({ ...base, confirmedAt: 2, languagesConfirmedAt: 3 })).toBe('validate');
        expect(
            availableTranslationFlowStep({
                ...base,
                confirmedAt: 2,
                languagesConfirmedAt: 3,
                items: [
                    {
                        ...base.items[0],
                        mediaValidationStatus: 'VALID',
                        detectedMimeType: 'image/png',
                        widthPx: 100,
                        heightPx: 200,
                        validatedAt: 4,
                        validationPolicyVersion: MEDIA_VALIDATION_POLICY_VERSION,
                    },
                ],
            }),
        ).toBe('review');
    });

    it('allows looking back but never skipping a prerequisite', () => {
        expect(visibleTranslationFlowStep('validate', 'organize')).toBe('organize');
        expect(visibleTranslationFlowStep('languages', 'review')).toBe('languages');
        expect(visibleTranslationFlowStep('review', null)).toBe('review');
    });
});
