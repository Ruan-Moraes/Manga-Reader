import {
    LOCAL_MEDIA_IMPORT_NAMESPACE,
    type LocalMediaImportDraft,
    type LocalMediaImportItem,
    type LocalMediaImportRepository,
    localMediaImportRepository,
    type MediaValidationFields,
} from '@/entities/local-media-import';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/shared/files';
import { inspectLocalImage, MEDIA_VALIDATION_POLICY_VERSION, type MediaInspectionResult } from '@/shared/media-inspection';
import { type LocalMediaPicker, systemLocalMediaPicker } from '@/shared/media-picker';

export type ValidateLocalMediaErrorCode = 'prerequisite-required' | 'stale-draft' | 'storage-unavailable' | 'picker-unavailable' | 'invalid-selection';

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
    picker: LocalMediaPicker;
    createId(): string;
    now(): number;
}

export interface ValidateLocalMediaController {
    itemUri(draft: LocalMediaImportDraft, item: LocalMediaImportItem): string;
    validate(draft: LocalMediaImportDraft, options?: { force?: boolean; onProgress?: (progress: ValidationProgress) => void }): Promise<LocalMediaImportDraft>;
    replaceItem(draft: LocalMediaImportDraft, itemId: string): Promise<LocalMediaImportDraft>;
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

let replacementSequence = 0;

export function createValidateLocalMediaController(overrides: Partial<Dependencies> = {}): ValidateLocalMediaController {
    const dependencies: Dependencies = {
        repository: localMediaImportRepository,
        files: appPrivateBatchFiles,
        inspect: inspectLocalImage,
        picker: systemLocalMediaPicker,
        createId: () => `replacement-${Date.now().toString(36)}-${(++replacementSequence).toString(36)}`,
        now: Date.now,
        ...overrides,
    };
    let activeOperation: Promise<LocalMediaImportDraft> | null = null;

    const runExclusively = (operation: () => Promise<LocalMediaImportDraft>): Promise<LocalMediaImportDraft> => {
        if (activeOperation) return activeOperation;
        activeOperation = operation().finally(() => {
            activeOperation = null;
        });
        return activeOperation;
    };

    return {
        itemUri(draft, item) {
            return dependencies.files.fileUri(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, item.localFilename);
        },
        validate(draft, options = {}) {
            return runExclusively(async () => {
                if (!draft.items.length || draft.confirmedAt === null || draft.languagesConfirmedAt === null) {
                    throw new ValidateLocalMediaError('prerequisite-required');
                }
                // Own the snapshot so per-page commits do not clone or hydrate the entire batch.
                const current = { ...draft, items: draft.items.map(item => ({ ...item })) };
                const pending = current.items.filter(item => options.force || !isCurrent(item));
                options.onProgress?.({ completed: 0, total: pending.length });
                for (const [index, item] of pending.entries()) {
                    const uri = dependencies.files.fileUri(LOCAL_MEDIA_IMPORT_NAMESPACE, current.id, item.localFilename);
                    const result = await dependencies.inspect(uri, item.byteSize).catch(() => {
                        throw new ValidateLocalMediaError('storage-unavailable');
                    });
                    const updatedAt = Math.max(dependencies.now(), current.updatedAt + 1);
                    const validation = validationFields(result, updatedAt);
                    try {
                        await dependencies.repository.updateMediaValidation(current.id, item.id, validation, updatedAt, current.updatedAt);
                    } catch (error) {
                        const code = error instanceof Error && error.message === 'localMediaImport.staleDraft' ? 'stale-draft' : 'storage-unavailable';
                        throw new ValidateLocalMediaError(code);
                    }
                    Object.assign(item, validation);
                    current.updatedAt = updatedAt;
                    options.onProgress?.({ completed: index + 1, total: pending.length });
                }
                return current;
            });
        },
        replaceItem(draft, itemId) {
            return runExclusively(async () => {
                const item = draft.items.find(candidate => candidate.id === itemId);
                if (!item) throw new ValidateLocalMediaError('stale-draft');

                const selection = await dependencies.picker.pickImages({ selectionLimit: 1 });
                if (selection.status === 'cancelled') return draft;
                if (selection.status === 'error') {
                    throw new ValidateLocalMediaError(selection.code === 'invalid-result' ? 'invalid-selection' : 'picker-unavailable');
                }
                if (selection.images.length !== 1) throw new ValidateLocalMediaError('invalid-selection');

                const operationId = dependencies.createId();
                const replacementFilename = `${item.id}-${operationId}`;
                let promoted = false;
                try {
                    const [stored] = await dependencies.files.stageBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, operationId, [
                        { sourceUri: selection.images[0].uri, filename: replacementFilename },
                    ]);
                    await dependencies.files.promoteStagedFiles(LOCAL_MEDIA_IMPORT_NAMESPACE, operationId, draft.id, [stored.filename]);
                    promoted = true;
                    const updatedAt = Math.max(dependencies.now(), draft.updatedAt + 1);
                    const replacement = await dependencies.repository.replaceItem(
                        draft.id,
                        item.id,
                        {
                            localFilename: stored.filename,
                            byteSize: stored.byteSize,
                            mimeHint: selection.images[0].mimeType,
                            createdAt: updatedAt,
                        },
                        updatedAt,
                        draft.updatedAt,
                    );
                    await dependencies.files.removeFile(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, replacement.previousFilename).catch(() => undefined);
                    return replacement.draft;
                } catch (error) {
                    await dependencies.files.discardStaging(LOCAL_MEDIA_IMPORT_NAMESPACE, operationId).catch(() => undefined);
                    if (promoted) {
                        await dependencies.files.removeFile(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, replacementFilename).catch(() => undefined);
                    }
                    if (error instanceof ValidateLocalMediaError) throw error;
                    const code = error instanceof Error && error.message === 'localMediaImport.staleDraft' ? 'stale-draft' : 'storage-unavailable';
                    throw new ValidateLocalMediaError(code);
                }
            });
        },
        reload: () => dependencies.repository.getActive(),
    };
}

export const validateLocalMediaController = createValidateLocalMediaController();
