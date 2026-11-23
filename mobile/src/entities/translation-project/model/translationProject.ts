import type { TranslationLanguageCode } from '@/entities/local-media-import/@x/translation-project';
import type { TranslationPage, TranslationState } from '@/entities/translation-page/@x/translation-project';

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

/** How a project's card names its state: queued and processing are one "in progress" stage (MOB-FEAT-024). */
export type TranslationProjectStage = 'DRAFT' | 'inProgress' | 'READY' | 'FAILED' | 'CANCELLED';

export function translationProjectStage(status: TranslationProject['status']): TranslationProjectStage {
    return status === 'QUEUED' || status === 'PROCESSING' ? 'inProgress' : status;
}
