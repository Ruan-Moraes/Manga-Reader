import {
    isValidTranslationLanguagePair,
    type LocalMediaImportDraft,
    type LocalMediaImportRepository,
    localMediaImportRepository,
    type TranslationLanguagePair,
} from '@/entities/local-media-import';

export type SelectTranslationLanguagesErrorCode = 'same-language' | 'review-required' | 'stale-draft' | 'storage-unavailable';

export class SelectTranslationLanguagesError extends Error {
    constructor(readonly code: SelectTranslationLanguagesErrorCode) {
        super(code);
        this.name = 'SelectTranslationLanguagesError';
    }
}

export interface SelectTranslationLanguagesController {
    update(draft: LocalMediaImportDraft, pair: TranslationLanguagePair): Promise<LocalMediaImportDraft>;
    confirm(draft: LocalMediaImportDraft): Promise<LocalMediaImportDraft>;
    reload(): Promise<LocalMediaImportDraft | null>;
}

interface Dependencies {
    repository: LocalMediaImportRepository;
    now: () => number;
}

function mapRepositoryError(error: unknown): SelectTranslationLanguagesError {
    if (error instanceof SelectTranslationLanguagesError) return error;
    const message = error instanceof Error ? error.message : '';
    if (message.includes('invalidLanguagePair')) return new SelectTranslationLanguagesError('same-language');
    if (message.includes('reviewRequired')) return new SelectTranslationLanguagesError('review-required');
    if (message.includes('staleDraft')) return new SelectTranslationLanguagesError('stale-draft');
    return new SelectTranslationLanguagesError('storage-unavailable');
}

export function createSelectTranslationLanguagesController(overrides: Partial<Dependencies> = {}): SelectTranslationLanguagesController {
    const dependencies: Dependencies = { repository: localMediaImportRepository, now: Date.now, ...overrides };
    let activeOperation: Promise<LocalMediaImportDraft> | null = null;

    const runExclusively = (operation: () => Promise<LocalMediaImportDraft>): Promise<LocalMediaImportDraft> => {
        if (activeOperation) return activeOperation;
        activeOperation = operation().finally(() => {
            activeOperation = null;
        });
        return activeOperation;
    };

    return {
        update(draft, pair) {
            if (!isValidTranslationLanguagePair(pair)) return Promise.reject(new SelectTranslationLanguagesError('same-language'));
            return runExclusively(async () => {
                try {
                    return await dependencies.repository.updateLanguages(draft.id, pair, dependencies.now(), draft.updatedAt);
                } catch (error) {
                    throw mapRepositoryError(error);
                }
            });
        },
        confirm(draft) {
            if (!isValidTranslationLanguagePair(draft)) return Promise.reject(new SelectTranslationLanguagesError('same-language'));
            return runExclusively(async () => {
                try {
                    return await dependencies.repository.confirmLanguages(draft.id, dependencies.now(), draft.updatedAt);
                } catch (error) {
                    throw mapRepositoryError(error);
                }
            });
        },
        reload() {
            return dependencies.repository.getActive();
        },
    };
}

export const selectTranslationLanguagesController = createSelectTranslationLanguagesController();
