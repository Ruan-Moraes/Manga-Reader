export const TRANSLATION_LANGUAGE_CODES = ['ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR'] as const;

export type TranslationLanguageCode = (typeof TRANSLATION_LANGUAGE_CODES)[number];

export interface TranslationLanguagePair {
    sourceLanguage: TranslationLanguageCode;
    targetLanguage: TranslationLanguageCode;
}

export const DEFAULT_TRANSLATION_LANGUAGE_PAIR: TranslationLanguagePair = {
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
};

export const MEDIA_VALIDATION_STATUSES = ['PENDING', 'VALID', 'INVALID'] as const;
export type MediaValidationStatus = (typeof MEDIA_VALIDATION_STATUSES)[number];
export const MEDIA_VALIDATION_ERROR_CODES = ['MISSING_FILE', 'EMPTY_FILE', 'FILE_CHANGED', 'UNSUPPORTED_FORMAT', 'CORRUPTED', 'DIMENSIONS_UNSAFE'] as const;
export type MediaValidationErrorCode = (typeof MEDIA_VALIDATION_ERROR_CODES)[number];
export type ValidatedMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface MediaValidationFields {
    mediaValidationStatus: MediaValidationStatus;
    mediaValidationError: MediaValidationErrorCode | null;
    detectedMimeType: ValidatedMediaType | null;
    widthPx: number | null;
    heightPx: number | null;
    validatedAt: number | null;
    validationPolicyVersion: number | null;
}

export const PENDING_MEDIA_VALIDATION: MediaValidationFields = {
    mediaValidationStatus: 'PENDING',
    mediaValidationError: null,
    detectedMimeType: null,
    widthPx: null,
    heightPx: null,
    validatedAt: null,
    validationPolicyVersion: null,
};

export function isTranslationLanguageCode(value: unknown): value is TranslationLanguageCode {
    return typeof value === 'string' && TRANSLATION_LANGUAGE_CODES.some(code => code === value);
}

export function isValidTranslationLanguagePair(pair: { sourceLanguage: unknown; targetLanguage: unknown }): pair is TranslationLanguagePair {
    return isTranslationLanguageCode(pair.sourceLanguage) && isTranslationLanguageCode(pair.targetLanguage) && pair.sourceLanguage !== pair.targetLanguage;
}

export interface LocalMediaImportItem extends MediaValidationFields {
    id: string;
    position: number;
    localFilename: string;
    byteSize: number;
    mimeHint: string | null;
    createdAt: number;
}

export interface LocalMediaImportDraft {
    id: string;
    createdAt: number;
    updatedAt: number;
    confirmedAt: number | null;
    sourceLanguage: TranslationLanguageCode;
    targetLanguage: TranslationLanguageCode;
    languagesConfirmedAt: number | null;
    items: LocalMediaImportItem[];
}

export type NewLocalMediaImportDraft = LocalMediaImportDraft;

export function isMediaValidationReady(draft: LocalMediaImportDraft, policyVersion: number): boolean {
    return (
        draft.items.length > 0 &&
        draft.confirmedAt !== null &&
        draft.languagesConfirmedAt !== null &&
        draft.items.every(item => item.mediaValidationStatus === 'VALID' && item.validationPolicyVersion === policyVersion)
    );
}
