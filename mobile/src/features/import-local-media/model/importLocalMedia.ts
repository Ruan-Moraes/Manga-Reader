import {
    DEFAULT_TRANSLATION_LANGUAGE_PAIR,
    LOCAL_MEDIA_IMPORT_NAMESPACE,
    type LocalMediaImportDraft,
    type LocalMediaImportRepository,
    localMediaImportRepository,
    PENDING_MEDIA_VALIDATION,
} from '@/entities/local-media-import';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/shared/files';
import { type LocalMediaPicker, type LocalMediaPickerResult, systemLocalMediaPicker } from '@/shared/media-picker';

export type LocalMediaImportErrorCode = 'picker-unavailable' | 'invalid-selection' | 'storage-unavailable';

export class LocalMediaImportError extends Error {
    constructor(readonly code: LocalMediaImportErrorCode) {
        super(code);
        this.name = 'LocalMediaImportError';
    }
}

export type LocalMediaImportOutcome = { status: 'imported'; draft: LocalMediaImportDraft } | { status: 'cancelled' } | { status: 'unchanged' };

export interface LocalMediaImportController {
    initialize(): Promise<LocalMediaImportDraft | null>;
    selectImages(): Promise<LocalMediaImportOutcome>;
    recoverPendingSelection(): Promise<LocalMediaImportOutcome>;
}

interface Dependencies {
    picker: LocalMediaPicker;
    files: PrivateBatchFiles;
    repository: LocalMediaImportRepository;
    createId: (scope: 'draft' | 'item') => string;
    now: () => number;
}

let sequence = 0;
const createId = (scope: 'draft' | 'item'): string =>
    `${scope}-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function createLocalMediaImportController(overrides: Partial<Dependencies> = {}): LocalMediaImportController {
    const dependencies: Dependencies = {
        picker: systemLocalMediaPicker,
        files: appPrivateBatchFiles,
        repository: localMediaImportRepository,
        createId,
        now: Date.now,
        ...overrides,
    };
    let pendingResultChecked = false;
    let activeOperation: Promise<LocalMediaImportOutcome> | null = null;

    const runExclusively = (operation: () => Promise<LocalMediaImportOutcome>): Promise<LocalMediaImportOutcome> => {
        if (activeOperation) return activeOperation;
        activeOperation = operation().finally(() => {
            activeOperation = null;
        });
        return activeOperation;
    };

    const importResult = async (result: LocalMediaPickerResult | null): Promise<LocalMediaImportOutcome> => {
        if (result === null) return { status: 'unchanged' };
        if (result.status === 'cancelled') return { status: 'cancelled' };
        if (result.status === 'error') throw new LocalMediaImportError(result.code === 'invalid-result' ? 'invalid-selection' : 'picker-unavailable');
        if (result.images.length === 0) throw new LocalMediaImportError('invalid-selection');

        const draftId = dependencies.createId('draft');
        const timestamp = dependencies.now();
        const itemInputs = result.images.map((image, position) => ({
            id: dependencies.createId('item'),
            position,
            sourceUri: image.uri,
            mimeHint: image.mimeType,
        }));

        try {
            const storedFiles = await dependencies.files.stageBatch(
                LOCAL_MEDIA_IMPORT_NAMESPACE,
                draftId,
                itemInputs.map(item => ({ sourceUri: item.sourceUri, filename: item.id })),
            );
            await dependencies.files.promoteBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, draftId);

            const draft: LocalMediaImportDraft = {
                id: draftId,
                createdAt: timestamp,
                updatedAt: timestamp,
                confirmedAt: null,
                ...DEFAULT_TRANSLATION_LANGUAGE_PAIR,
                languagesConfirmedAt: null,
                items: itemInputs.map((item, index) => ({
                    id: item.id,
                    position: item.position,
                    localFilename: storedFiles[index].filename,
                    byteSize: storedFiles[index].byteSize,
                    mimeHint: item.mimeHint,
                    createdAt: timestamp,
                    ...PENDING_MEDIA_VALIDATION,
                })),
            };
            const previousDraftId = await dependencies.repository.replaceActive(draft);
            if (previousDraftId && previousDraftId !== draft.id) {
                void dependencies.files.removeBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, previousDraftId).catch(() => undefined);
            }
            return { status: 'imported', draft };
        } catch (error) {
            await dependencies.files.discardStaging(LOCAL_MEDIA_IMPORT_NAMESPACE, draftId);
            await dependencies.files.removeBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, draftId);
            if (error instanceof LocalMediaImportError) throw error;
            throw new LocalMediaImportError('storage-unavailable');
        }
    };

    return {
        async initialize() {
            try {
                await dependencies.repository.initialize();
                const validDraftIds = await dependencies.repository.getReferencedDraftIds();
                await dependencies.files.reconcile(LOCAL_MEDIA_IMPORT_NAMESPACE, validDraftIds);
                return dependencies.repository.getActive();
            } catch {
                throw new LocalMediaImportError('storage-unavailable');
            }
        },
        selectImages() {
            return runExclusively(async () => importResult(await dependencies.picker.pickImages()));
        },
        recoverPendingSelection() {
            if (pendingResultChecked) return Promise.resolve({ status: 'unchanged' });
            pendingResultChecked = true;
            return runExclusively(async () => importResult(await dependencies.picker.getPendingImages()));
        },
    };
}

export const localMediaImportController = createLocalMediaImportController();
