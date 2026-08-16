import { useCallback, useEffect, useRef, useState } from 'react';

import {
    isValidTranslationLanguagePair,
    type LocalMediaImportDraft,
    type TranslationLanguageCode,
    type TranslationLanguagePair,
} from '@/src/entities/local-media-import';

import {
    type SelectTranslationLanguagesController,
    selectTranslationLanguagesController,
    SelectTranslationLanguagesError,
    type SelectTranslationLanguagesErrorCode,
} from './selectTranslationLanguages';

type LanguageAction = () => Promise<LocalMediaImportDraft>;

const errorCode = (error: unknown): SelectTranslationLanguagesErrorCode =>
    error instanceof SelectTranslationLanguagesError ? error.code : 'storage-unavailable';

export function useSelectTranslationLanguages(
    draft: LocalMediaImportDraft,
    onDraftChange: (draft: LocalMediaImportDraft) => void,
    controller: SelectTranslationLanguagesController = selectTranslationLanguagesController,
) {
    const [selection, setSelection] = useState<TranslationLanguagePair>({
        sourceLanguage: draft.sourceLanguage,
        targetLanguage: draft.targetLanguage,
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<SelectTranslationLanguagesErrorCode | null>(null);
    const retryRef = useRef<LanguageAction | null>(null);

    useEffect(() => {
        setSelection({ sourceLanguage: draft.sourceLanguage, targetLanguage: draft.targetLanguage });
    }, [draft.sourceLanguage, draft.targetLanguage]);

    const execute = useCallback(
        async (action: LanguageAction) => {
            if (busy) return;
            retryRef.current = action;
            setBusy(true);
            setError(null);
            try {
                const updated = await action();
                setSelection({ sourceLanguage: updated.sourceLanguage, targetLanguage: updated.targetLanguage });
                onDraftChange(updated);
            } catch (caught) {
                setError(errorCode(caught));
                const persisted = await controller.reload().catch(() => draft);
                if (persisted) {
                    setSelection({ sourceLanguage: persisted.sourceLanguage, targetLanguage: persisted.targetLanguage });
                    onDraftChange(persisted);
                }
            } finally {
                setBusy(false);
            }
        },
        [busy, controller, draft, onDraftChange],
    );

    const select = (field: 'sourceLanguage' | 'targetLanguage', value: TranslationLanguageCode) => {
        if (busy) return;
        const next = { ...selection, [field]: value };
        setSelection(next);
        if (!isValidTranslationLanguagePair(next)) {
            setError('same-language');
            retryRef.current = null;
            return;
        }
        void execute(() => controller.update(draft, next));
    };

    return {
        selection,
        valid: isValidTranslationLanguagePair(selection),
        busy,
        error,
        selectSource: (value: TranslationLanguageCode) => select('sourceLanguage', value),
        selectTarget: (value: TranslationLanguageCode) => select('targetLanguage', value),
        confirm: () => execute(() => controller.confirm(draft)),
        retry: () => (retryRef.current ? execute(retryRef.current) : Promise.resolve()),
    };
}
