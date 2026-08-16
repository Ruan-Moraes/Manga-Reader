import {
    LOCAL_MEDIA_IMPORT_NAMESPACE,
    type LocalMediaImportDraft,
    type LocalMediaImportItem,
    type LocalMediaImportRepository,
    localMediaImportRepository,
    type MediaValidationFields,
} from '@/src/entities/local-media-import';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/src/shared/files';
import { inspectLocalImage, MEDIA_VALIDATION_POLICY_VERSION, type MediaInspectionResult } from '@/src/shared/media-inspection';

export type ValidateLocalMediaErrorCode = 'prerequisite-required' | 'stale-draft' | 'storage-unavailable';

export class ValidateLocalMediaError extends Error {
    constructor(readonly code: ValidateLocalMediaErrorCode) {
        super(code);
    }
}

export interface ValidationProgress {
    completed: number;
    total: number;
}

interface Dependencies {
    repository: LocalMediaImportRepository;
    files: PrivateBatchFiles;
    inspect(uri: string, expectedSize: number): Promise<MediaInspectionResult>;
    now(): number;
}

export interface ValidateLocalMediaController {
    validate(draft: LocalMediaImportDraft, options?: { force?: boolean; onProgress?: (progress: ValidationProgress) => void }): Promise<LocalMediaImportDraft>;
    reload(): Promise<LocalMediaImportDraft | null>;
}

function validationFields(result: MediaInspectionResult, validatedAt: number): MediaValidationFields {
    if (result.status === 'valid') {
        return {
            mediaValidationStatus: 'VALID',
            mediaValidationError: null,
            detectedMimeType: result.mimeType,
            widthPx: result.width,
            heightPx: result.height,
            validatedAt,
            validationPolicyVersion: MEDIA_VALIDATION_POLICY_VERSION,
        };
    }
    return {
        mediaValidationStatus: 'INVALID',
        mediaValidationError: result.error,
        detectedMimeType: result.mimeType ?? null,
        widthPx: result.width ?? null,
        heightPx: result.height ?? null,
        validatedAt,
        validationPolicyVersion: MEDIA_VALIDATION_POLICY_VERSION,
    };
}

const isCurrent = (item: LocalMediaImportItem) => item.mediaValidationStatus === 'VALID' && item.validationPolicyVersion === MEDIA_VALIDATION_POLICY_VERSION;

export function createValidateLocalMediaController(dependencies: Dependencies): ValidateLocalMediaController {
    let activeOperation: Promise<LocalMediaImportDraft> | null = null;

    return {
        validate(draft, options = {}) {
            if (activeOperation) return activeOperation;
            activeOperation = (async () => {
                if (!draft.items.length || draft.confirmedAt === null || draft.languagesConfirmedAt === null) {
                    throw new ValidateLocalMediaError('prerequisite-required');
                }
                let current = draft;
                const pending = current.items.filter(item => options.force || !isCurrent(item));
                options.onProgress?.({ completed: 0, total: pending.length });
                for (const [index, selected] of pending.entries()) {
                    const item = current.items.find(candidate => candidate.id === selected.id);
                    if (!item) throw new ValidateLocalMediaError('stale-draft');
                    const uri = dependencies.files.fileUri(LOCAL_MEDIA_IMPORT_NAMESPACE, current.id, item.localFilename);
                    const result = await dependencies.inspect(uri, item.byteSize).catch(() => {
                        throw new ValidateLocalMediaError('storage-unavailable');
                    });
                    const updatedAt = Math.max(dependencies.now(), current.updatedAt + 1);
                    try {
                        current = await dependencies.repository.updateMediaValidation(
                            current.id,
                            item.id,
                            validationFields(result, updatedAt),
                            updatedAt,
                            current.updatedAt,
                        );
                    } catch (error) {
                        const code = error instanceof Error && error.message === 'localMediaImport.staleDraft' ? 'stale-draft' : 'storage-unavailable';
                        throw new ValidateLocalMediaError(code);
                    }
                    options.onProgress?.({ completed: index + 1, total: pending.length });
                }
                return current;
            })().finally(() => {
                activeOperation = null;
            });
            return activeOperation;
        },
        reload: () => dependencies.repository.getActive(),
    };
}

export const validateLocalMediaController = createValidateLocalMediaController({
    repository: localMediaImportRepository,
    files: appPrivateBatchFiles,
    inspect: inspectLocalImage,
    now: Date.now,
});
