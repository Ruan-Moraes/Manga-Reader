import {
    LOCAL_MEDIA_IMPORT_NAMESPACE,
    type LocalMediaImportDraft,
    type LocalMediaImportItem,
    type LocalMediaImportRepository,
    localMediaImportRepository,
    type NewLocalMediaImportItem,
    PENDING_MEDIA_VALIDATION,
} from '@/entities/local-media-import';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/shared/files';
import { type LocalMediaPicker, type LocalMediaPickerResult, systemLocalMediaPicker } from '@/shared/media-picker';

export type ReviewLocalMediaImportErrorCode = 'picker-unavailable' | 'invalid-selection' | 'storage-unavailable';

export class ReviewLocalMediaImportError extends Error {
    constructor(readonly code: ReviewLocalMediaImportErrorCode) {
        super(code);
        this.name = 'ReviewLocalMediaImportError';
    }
}

export type ReviewLocalMediaImportOutcome =
    | { status: 'updated'; draft: LocalMediaImportDraft }
    | { status: 'unchanged'; draft: LocalMediaImportDraft }
    | { status: 'cleared' };

export interface ReviewLocalMediaImportController {
    reconcile(draft: LocalMediaImportDraft): Promise<void>;
    itemUri(draft: LocalMediaImportDraft, item: LocalMediaImportItem): string;
    addImages(draft: LocalMediaImportDraft): Promise<ReviewLocalMediaImportOutcome>;
    removeItem(draft: LocalMediaImportDraft, itemId: string): Promise<ReviewLocalMediaImportOutcome>;
    moveItem(draft: LocalMediaImportDraft, itemId: string, offset: -1 | 1): Promise<ReviewLocalMediaImportOutcome>;
    reorderItems(draft: LocalMediaImportDraft, orderedItemIds: readonly string[]): Promise<ReviewLocalMediaImportOutcome>;
    confirm(draft: LocalMediaImportDraft): Promise<ReviewLocalMediaImportOutcome>;
    reload(): Promise<LocalMediaImportDraft | null>;
}

interface Dependencies {
    picker: LocalMediaPicker;
    files: PrivateBatchFiles;
    repository: LocalMediaImportRepository;
    createId: (scope: 'operation' | 'item') => string;
    now: () => number;
}

let sequence = 0;
const createId = (scope: 'operation' | 'item'): string =>
    `${scope}-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function possibleDuplicateItemIds(draft: LocalMediaImportDraft): Set<string> {
    const groups = new Map<string, string[]>();
    for (const item of draft.items) {
        if (item.byteSize <= 0) continue;
        const key = `${item.byteSize}:${item.mimeHint ?? 'unknown'}`;
        groups.set(key, [...(groups.get(key) ?? []), item.id]);
    }
    return new Set([...groups.values()].filter(ids => ids.length > 1).flat());
}

function pickerError(result: Extract<LocalMediaPickerResult, { status: 'error' }>): ReviewLocalMediaImportError {
    return new ReviewLocalMediaImportError(result.code === 'invalid-result' ? 'invalid-selection' : 'picker-unavailable');
}

export function createReviewLocalMediaImportController(overrides: Partial<Dependencies> = {}): ReviewLocalMediaImportController {
    const dependencies: Dependencies = {
        picker: systemLocalMediaPicker,
        files: appPrivateBatchFiles,
        repository: localMediaImportRepository,
        createId,
        now: Date.now,
        ...overrides,
    };
    let activeOperation: Promise<ReviewLocalMediaImportOutcome> | null = null;

    const runExclusively = (operation: () => Promise<ReviewLocalMediaImportOutcome>): Promise<ReviewLocalMediaImportOutcome> => {
        if (activeOperation) return activeOperation;
        activeOperation = operation().finally(() => {
            activeOperation = null;
        });
        return activeOperation;
    };

    return {
        reconcile(draft) {
            return dependencies.files.reconcileBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, new Set(draft.items.map(item => item.localFilename)));
        },
        itemUri(draft, item) {
            return dependencies.files.fileUri(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, item.localFilename);
        },
        addImages(draft) {
            return runExclusively(async () => {
                const result = await dependencies.picker.pickImages();
                if (result.status === 'cancelled') return { status: 'unchanged', draft };
                if (result.status === 'error') throw pickerError(result);
                if (result.images.length === 0) throw new ReviewLocalMediaImportError('invalid-selection');

                const stagingId = dependencies.createId('operation');
                const timestamp = dependencies.now();
                const inputs = result.images.map(image => ({ id: dependencies.createId('item'), sourceUri: image.uri, mimeHint: image.mimeType }));
                const promotedFilenames: string[] = [];
                try {
                    const stored = await dependencies.files.stageBatch(
                        LOCAL_MEDIA_IMPORT_NAMESPACE,
                        stagingId,
                        inputs.map(item => ({ sourceUri: item.sourceUri, filename: item.id })),
                    );
                    promotedFilenames.push(...stored.map(file => file.filename));
                    await dependencies.files.promoteStagedFiles(LOCAL_MEDIA_IMPORT_NAMESPACE, stagingId, draft.id, promotedFilenames);
                    const newItems: NewLocalMediaImportItem[] = inputs.map((item, index) => ({
                        ...PENDING_MEDIA_VALIDATION,
                        id: item.id,
                        localFilename: stored[index].filename,
                        byteSize: stored[index].byteSize,
                        mimeHint: item.mimeHint,
                        createdAt: timestamp,
                    }));
                    return { status: 'updated', draft: await dependencies.repository.appendItems(draft.id, newItems, timestamp) };
                } catch {
                    await dependencies.files.discardStaging(LOCAL_MEDIA_IMPORT_NAMESPACE, stagingId);
                    await Promise.all(promotedFilenames.map(filename => dependencies.files.removeFile(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, filename)));
                    throw new ReviewLocalMediaImportError('storage-unavailable');
                }
            });
        },
        removeItem(draft, itemId) {
            return runExclusively(async () => {
                try {
                    const removed = await dependencies.repository.removeItem(draft.id, itemId, dependencies.now());
                    if (!removed.draft) {
                        await dependencies.files.removeBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id).catch(() => undefined);
                        return { status: 'cleared' };
                    }
                    await dependencies.files.removeFile(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, removed.filename).catch(() => undefined);
                    return { status: 'updated', draft: removed.draft };
                } catch {
                    throw new ReviewLocalMediaImportError('storage-unavailable');
                }
            });
        },
        moveItem(draft, itemId, offset) {
            return runExclusively(async () => {
                const index = draft.items.findIndex(item => item.id === itemId);
                const target = index + offset;
                if (index < 0 || target < 0 || target >= draft.items.length) return { status: 'unchanged', draft };
                const ids = draft.items.map(item => item.id);
                [ids[index], ids[target]] = [ids[target], ids[index]];
                try {
                    return { status: 'updated', draft: await dependencies.repository.reorderItems(draft.id, ids, dependencies.now()) };
                } catch {
                    throw new ReviewLocalMediaImportError('storage-unavailable');
                }
            });
        },
        reorderItems(draft, orderedItemIds) {
            return runExclusively(async () => {
                try {
                    return { status: 'updated', draft: await dependencies.repository.reorderItems(draft.id, orderedItemIds, dependencies.now()) };
                } catch {
                    throw new ReviewLocalMediaImportError('storage-unavailable');
                }
            });
        },
        confirm(draft) {
            return runExclusively(async () => {
                try {
                    return { status: 'updated', draft: await dependencies.repository.confirm(draft.id, dependencies.now()) };
                } catch {
                    throw new ReviewLocalMediaImportError('storage-unavailable');
                }
            });
        },
        reload() {
            return dependencies.repository.getActive();
        },
    };
}

export const reviewLocalMediaImportController = createReviewLocalMediaImportController();
