import { type LocalMediaImportDraft, type LocalMediaImportRepository, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import type { PrivateBatchFiles, PrivateFileInput, StoredPrivateFile } from '@/shared/files';
import type { LocalMediaPicker, LocalMediaPickerResult } from '@/shared/media-picker';

import { createLocalMediaImportController, LocalMediaImportError } from '../importLocalMedia';

function fixture(options: { active?: LocalMediaImportDraft | null; pick?: LocalMediaPickerResult; pending?: LocalMediaPickerResult | null } = {}) {
    let active = options.active ?? null;
    const events: string[] = [];
    const stored = new Map<string, StoredPrivateFile[]>();
    const picker: LocalMediaPicker = {
        pickImages: jest.fn().mockResolvedValue(options.pick ?? { status: 'cancelled' }),
        getPendingImages: jest.fn().mockResolvedValue(options.pending ?? null),
    };
    const files: PrivateBatchFiles = {
        stageBatch: jest.fn(async (_namespace: string, draftId: string, inputs: readonly PrivateFileInput[]) => {
            events.push(`stage:${draftId}`);
            const result = inputs.map((input, index) => ({ filename: input.filename, byteSize: (index + 1) * 10 }));
            stored.set(draftId, result);
            return result;
        }),
        promoteBatch: jest.fn(async (_namespace, draftId) => {
            events.push(`promote:${draftId}`);
        }),
        promoteStagedFiles: jest.fn(async () => undefined),
        discardStaging: jest.fn(async () => undefined),
        removeBatch: jest.fn(async (_namespace, draftId) => {
            events.push(`remove:${draftId}`);
            stored.delete(draftId);
        }),
        removeFile: jest.fn(async () => undefined),
        clearNamespace: jest.fn(async () => undefined),
        reconcile: jest.fn(async () => undefined),
        reconcileBatch: jest.fn(async () => undefined),
        fileUri: (_namespace, draftId, filename) => `file:///private/${draftId}/${filename}`,
        fileExists: jest.fn(async (_namespace, draftId, filename) => stored.get(draftId)?.some(file => file.filename === filename) ?? false),
    };
    const repository: LocalMediaImportRepository = {
        initialize: jest.fn(async () => undefined),
        getActive: jest.fn(async () => active),
        replaceActive: jest.fn(async draft => {
            events.push(`metadata:${draft.id}`);
            const previous = active?.id ?? null;
            active = draft;
            return previous;
        }),
        appendItems: jest.fn(async () => {
            throw new Error('not used');
        }),
        replaceItem: jest.fn(async () => {
            throw new Error('not used');
        }),
        removeItem: jest.fn(async () => {
            throw new Error('not used');
        }),
        reorderItems: jest.fn(async () => {
            throw new Error('not used');
        }),
        confirm: jest.fn(async () => {
            throw new Error('not used');
        }),
        updateLanguages: jest.fn(async () => {
            throw new Error('not used');
        }),
        confirmLanguages: jest.fn(async () => {
            throw new Error('not used');
        }),
        updateMediaValidation: jest.fn(async () => {
            throw new Error('not used');
        }),
        getReferencedDraftIds: jest.fn(async () => new Set(active ? [active.id] : [])),
        measureBytes: jest.fn(async () => active?.items.reduce((sum, item) => sum + item.byteSize, 0) ?? 0),
        clear: jest.fn(async () => {
            active = null;
        }),
        consumeActive: jest.fn(async () => {
            active = null;
        }),
    };
    const ids = ['draft-new', 'item-1', 'item-2'];
    const controller = createLocalMediaImportController({
        picker,
        files,
        repository,
        createId: () => ids.shift() ?? 'unexpected-id',
        now: () => 100,
    });
    return { controller, events, files, picker, repository, getActive: () => active };
}

const previousDraft: LocalMediaImportDraft = {
    id: 'draft-old',
    createdAt: 1,
    updatedAt: 1,
    confirmedAt: null,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: null,
    items: [{ ...PENDING_MEDIA_VALIDATION, id: 'old-item', position: 0, localFilename: 'old-item', byteSize: 5, mimeHint: null, createdAt: 1 }],
};

describe('MOB-FEAT-012 local media import controller', () => {
    it('hydrates metadata and reconciles private files without source URIs', async () => {
        const { controller, files } = fixture({ active: previousDraft });

        await expect(controller.initialize()).resolves.toEqual(previousDraft);
        expect(files.reconcile).toHaveBeenCalledWith('local-media-imports', new Set(['draft-old']));
    });

    it('copies an explicit multi-selection before atomically replacing metadata', async () => {
        const { controller, events, files, getActive } = fixture({
            active: previousDraft,
            pick: {
                status: 'selected',
                images: [
                    { uri: 'content://one', mimeType: 'image/png', fileSize: 999 },
                    { uri: 'content://two', mimeType: null, fileSize: null },
                ],
            },
        });

        await expect(controller.selectImages()).resolves.toMatchObject({
            status: 'imported',
            draft: {
                id: 'draft-new',
                items: [
                    { id: 'item-1', position: 0, localFilename: 'item-1', byteSize: 10, mimeHint: 'image/png' },
                    { id: 'item-2', position: 1, localFilename: 'item-2', byteSize: 20, mimeHint: null },
                ],
            },
        });
        expect(events.slice(0, 3)).toEqual(['stage:draft-new', 'promote:draft-new', 'metadata:draft-new']);
        expect(files.stageBatch).toHaveBeenCalledWith('local-media-imports', 'draft-new', [
            { sourceUri: 'content://one', filename: 'item-1' },
            { sourceUri: 'content://two', filename: 'item-2' },
        ]);
        expect(getActive()).not.toHaveProperty('sourceUri');
        expect(files.removeBatch).toHaveBeenCalledWith('local-media-imports', 'draft-old');
    });

    it('treats cancellation as neutral and preserves the active draft', async () => {
        const { controller, files, repository, getActive } = fixture({ active: previousDraft, pick: { status: 'cancelled' } });

        await expect(controller.selectImages()).resolves.toEqual({ status: 'cancelled' });
        expect(files.stageBatch).not.toHaveBeenCalled();
        expect(repository.replaceActive).not.toHaveBeenCalled();
        expect(getActive()).toEqual(previousDraft);
    });

    it('rolls back private files and exposes only a sanitized storage error', async () => {
        const setup = fixture({
            active: previousDraft,
            pick: { status: 'selected', images: [{ uri: 'content://private/name', mimeType: null, fileSize: null }] },
        });
        jest.mocked(setup.files.promoteBatch).mockRejectedValueOnce(new Error('content://private/name no space'));

        await expect(setup.controller.selectImages()).rejects.toEqual(new LocalMediaImportError('storage-unavailable'));
        expect(setup.files.discardStaging).toHaveBeenCalledWith('local-media-imports', 'draft-new');
        expect(setup.files.removeBatch).toHaveBeenCalledWith('local-media-imports', 'draft-new');
        expect(setup.repository.replaceActive).not.toHaveBeenCalled();
        expect(setup.getActive()).toEqual(previousDraft);
    });

    it('consumes a pending Android result at most once', async () => {
        const setup = fixture({
            pending: { status: 'selected', images: [{ uri: 'content://pending', mimeType: 'image/jpeg', fileSize: null }] },
        });

        await expect(setup.controller.recoverPendingSelection()).resolves.toMatchObject({ status: 'imported' });
        await expect(setup.controller.recoverPendingSelection()).resolves.toEqual({ status: 'unchanged' });
        expect(setup.picker.getPendingImages).toHaveBeenCalledTimes(1);
        expect(setup.repository.replaceActive).toHaveBeenCalledTimes(1);
    });

    it('keeps the imported private file available independently from the original URI', async () => {
        const setup = fixture({
            pick: { status: 'selected', images: [{ uri: 'content://revoked-after-copy', mimeType: 'image/jpeg', fileSize: null }] },
        });
        const outcome = await setup.controller.selectImages();
        if (outcome.status !== 'imported') throw new Error('expected imported outcome');

        await expect(setup.files.fileExists('local-media-imports', outcome.draft.id, outcome.draft.items[0].localFilename)).resolves.toBe(true);
        expect(outcome.draft.items[0]).not.toHaveProperty('uri');
    });
});
