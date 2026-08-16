import {
    type LocalMediaImportDraft,
    type LocalMediaImportRepository,
    type NewLocalMediaImportItem,
    PENDING_MEDIA_VALIDATION,
} from '@/src/entities/local-media-import';
import type { PrivateBatchFiles, PrivateFileInput } from '@/src/shared/files';
import type { LocalMediaPicker, LocalMediaPickerResult } from '@/src/shared/media-picker';

import { createReviewLocalMediaImportController, possibleDuplicateItemIds, ReviewLocalMediaImportError } from '../reviewLocalMediaImport';

const initialDraft = (): LocalMediaImportDraft => ({
    id: 'draft-1',
    createdAt: 1,
    updatedAt: 1,
    confirmedAt: 5,
    sourceLanguage: 'en',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: 5,
    items: [
        { ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'item-1', byteSize: 10, mimeHint: 'image/png', createdAt: 1 },
        { ...PENDING_MEDIA_VALIDATION, id: 'item-2', position: 1, localFilename: 'item-2', byteSize: 20, mimeHint: 'image/jpeg', createdAt: 1 },
    ],
});

function fixture(pick: LocalMediaPickerResult = { status: 'cancelled' }) {
    let active: LocalMediaImportDraft | null = initialDraft();
    const picker: LocalMediaPicker = { pickImages: jest.fn().mockResolvedValue(pick), getPendingImages: jest.fn().mockResolvedValue(null) };
    const files: PrivateBatchFiles = {
        stageBatch: jest.fn(async (_namespace: string, _stagingId: string, inputs: readonly PrivateFileInput[]) =>
            inputs.map(input => ({ filename: input.filename, byteSize: 30 })),
        ),
        promoteBatch: jest.fn(async () => undefined),
        promoteStagedFiles: jest.fn(async () => undefined),
        discardStaging: jest.fn(async () => undefined),
        removeBatch: jest.fn(async () => undefined),
        removeFile: jest.fn(async () => undefined),
        clearNamespace: jest.fn(async () => undefined),
        reconcile: jest.fn(async () => undefined),
        reconcileBatch: jest.fn(async () => undefined),
        fileUri: (_namespace, draftId, filename) => `file:///private/${draftId}/${filename}`,
        fileExists: jest.fn(async () => true),
    };
    const repository: LocalMediaImportRepository = {
        initialize: jest.fn(async () => undefined),
        getActive: jest.fn(async () => active),
        replaceActive: jest.fn(async draft => {
            active = draft;
            return null;
        }),
        appendItems: jest.fn(async (draftId: string, items: readonly NewLocalMediaImportItem[], updatedAt: number) => {
            if (!active || active.id !== draftId) throw new Error('missing');
            active = {
                ...active,
                updatedAt,
                confirmedAt: null,
                languagesConfirmedAt: null,
                items: [...active.items, ...items.map((item, index) => ({ ...item, position: active!.items.length + index }))],
            };
            return active;
        }),
        removeItem: jest.fn(async (_draftId, itemId, updatedAt) => {
            if (!active) throw new Error('missing');
            const removed = active.items.find(item => item.id === itemId);
            if (!removed) throw new Error('missing');
            const remaining = active.items.filter(item => item.id !== itemId).map((item, position) => ({ ...item, position }));
            active = remaining.length ? { ...active, updatedAt, confirmedAt: null, languagesConfirmedAt: null, items: remaining } : null;
            return { draft: active, filename: removed.localFilename };
        }),
        reorderItems: jest.fn(async (_draftId, orderedIds, updatedAt) => {
            if (!active) throw new Error('missing');
            active = {
                ...active,
                updatedAt,
                confirmedAt: null,
                languagesConfirmedAt: null,
                items: orderedIds.map((id, position) => ({ ...active!.items.find(item => item.id === id)!, position })),
            };
            return active;
        }),
        confirm: jest.fn(async (_draftId, confirmedAt) => {
            if (!active) throw new Error('missing');
            active = { ...active, updatedAt: confirmedAt, confirmedAt };
            return active;
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
        measureBytes: jest.fn(async () => 0),
        clear: jest.fn(async () => {
            active = null;
        }),
        consumeActive: jest.fn(async () => {
            active = null;
        }),
    };
    const ids = ['operation-1', 'item-3', 'item-4'];
    const controller = createReviewLocalMediaImportController({ picker, files, repository, createId: () => ids.shift() ?? 'extra', now: () => 100 });
    return { controller, files, picker, repository, getActive: () => active };
}

describe('MOB-FEAT-013 review local media import controller', () => {
    it('derives private preview URIs and non-destructive possible duplicate groups', async () => {
        const setup = fixture();
        const duplicateDraft = initialDraft();
        duplicateDraft.items[1] = { ...duplicateDraft.items[1], byteSize: 10, mimeHint: 'image/png' };

        expect(setup.controller.itemUri(duplicateDraft, duplicateDraft.items[0])).toBe('file:///private/draft-1/item-1');
        expect(possibleDuplicateItemIds(duplicateDraft)).toEqual(new Set(['item-1', 'item-2']));
        await setup.controller.reconcile(duplicateDraft);
        expect(setup.files.reconcileBatch).toHaveBeenCalledWith('local-media-imports', 'draft-1', new Set(['item-1', 'item-2']));
    });

    it('appends selected files after private promotion and clears confirmation', async () => {
        const setup = fixture({
            status: 'selected',
            images: [
                { uri: 'content://three', mimeType: 'image/png', fileSize: 100 },
                { uri: 'content://four', mimeType: null, fileSize: null },
            ],
        });

        await expect(setup.controller.addImages(initialDraft())).resolves.toMatchObject({
            status: 'updated',
            draft: { confirmedAt: null, items: [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }, { id: 'item-4' }] },
        });
        expect(setup.files.stageBatch).toHaveBeenCalledWith('local-media-imports', 'operation-1', [
            { sourceUri: 'content://three', filename: 'item-3' },
            { sourceUri: 'content://four', filename: 'item-4' },
        ]);
        expect(setup.files.promoteStagedFiles).toHaveBeenCalledWith('local-media-imports', 'operation-1', 'draft-1', ['item-3', 'item-4']);
    });

    it('keeps the draft unchanged on cancellation and cleans promoted files after metadata failure', async () => {
        const cancelled = fixture();
        await expect(cancelled.controller.addImages(initialDraft())).resolves.toEqual({ status: 'unchanged', draft: initialDraft() });
        expect(cancelled.files.stageBatch).not.toHaveBeenCalled();

        const failed = fixture({ status: 'selected', images: [{ uri: 'content://private', mimeType: null, fileSize: null }] });
        jest.mocked(failed.repository.appendItems).mockRejectedValueOnce(new Error('content://private database failed'));
        await expect(failed.controller.addImages(initialDraft())).rejects.toEqual(new ReviewLocalMediaImportError('storage-unavailable'));
        expect(failed.files.removeFile).toHaveBeenCalledWith('local-media-imports', 'draft-1', 'item-3');
        expect(failed.getActive()).toEqual(initialDraft());
    });

    it('removes intermediate and last items with coordinated private cleanup', async () => {
        const setup = fixture();
        await expect(setup.controller.removeItem(initialDraft(), 'item-1')).resolves.toMatchObject({
            status: 'updated',
            draft: { items: [{ id: 'item-2', position: 0 }] },
        });
        expect(setup.files.removeFile).toHaveBeenCalledWith('local-media-imports', 'draft-1', 'item-1');

        const remaining = setup.getActive()!;
        await expect(setup.controller.removeItem(remaining, 'item-2')).resolves.toEqual({ status: 'cleared' });
        expect(setup.files.removeBatch).toHaveBeenCalledWith('local-media-imports', 'draft-1');
    });

    it('moves items, persists confirmation and serializes repeated actions', async () => {
        const setup = fixture();
        await expect(setup.controller.moveItem(initialDraft(), 'item-2', -1)).resolves.toMatchObject({
            status: 'updated',
            draft: { confirmedAt: null, items: [{ id: 'item-2' }, { id: 'item-1' }] },
        });
        const moved = setup.getActive()!;
        await expect(setup.controller.confirm(moved)).resolves.toMatchObject({ status: 'updated', draft: { confirmedAt: 100 } });

        const pending = setup.controller.confirm(setup.getActive()!);
        expect(setup.controller.confirm(setup.getActive()!)).toBe(pending);
        await pending;
    });
});
