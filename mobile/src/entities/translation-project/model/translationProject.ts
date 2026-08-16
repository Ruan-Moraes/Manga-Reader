import type { TranslationLanguageCode } from '@/src/entities/local-media-import/@x/translation-project';
import type { TranslationPage, TranslationState } from '@/src/entities/translation-page/@x/translation-project';

export interface TranslationProject {
    id: string;
    sourceLanguage: TranslationLanguageCode;
    targetLanguage: TranslationLanguageCode;
    status: TranslationState;
    createdAt: number;
    updatedAt: number;
    statusUpdatedAt: number;
    languageReviewRequired: boolean;
    pages: TranslationPage[];
}

export type NewTranslationProject = Omit<TranslationProject, 'languageReviewRequired'>;
