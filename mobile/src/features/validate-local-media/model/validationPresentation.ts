import type { LocalMediaImportItem, MediaValidationErrorCode } from '@/src/entities/local-media-import';

export type ValidationIssueOrigin = 'local' | 'processing';
export type ProcessingValidationIssueCode = 'WHITE_OUTLINE' | 'TRANSPARENT_BACKGROUND_FAILED';

export interface ValidationPresentationIssue {
    origin: ValidationIssueOrigin;
    code: MediaValidationErrorCode | ProcessingValidationIssueCode;
    technicalDetail?: ProcessingValidationIssueCode;
}

export function localValidationIssue(item: LocalMediaImportItem): ValidationPresentationIssue | null {
    return item.mediaValidationStatus === 'INVALID' && item.mediaValidationError ? { origin: 'local', code: item.mediaValidationError } : null;
}

export function validationIssueFor(item: LocalMediaImportItem, processingIssue?: ValidationPresentationIssue): ValidationPresentationIssue | null {
    return processingIssue ?? localValidationIssue(item);
}
