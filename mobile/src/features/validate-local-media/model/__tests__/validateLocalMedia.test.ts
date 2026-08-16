import { type LocalMediaImportDraft, type LocalMediaImportRepository, PENDING_MEDIA_VALIDATION } from '@/src/entities/local-media-import';
import type { PrivateBatchFiles } from '@/src/shared/files';
import type { MediaInspectionResult } from '@/src/shared/media-inspection';

import { createValidateLocalMediaController, ValidateLocalMediaError } from '../validateLocalMedia';

const draft = (): LocalMediaImportDraft => ({
    id: 'draft-1',
    createdAt: 1,
    updatedAt: 10,
    confirmedAt: 5,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: 8,
    items: [
        { ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'one', byteSize: 10, mimeHint: null, createdAt: 1 },
        { ...PENDING_MEDIA_VALIDATION, id: 'item-2', position: 1, localFilename: 'two', byteSize: 20, mimeHint: null, createdAt: 1 },
    ],
});

function setup(results: MediaInspectionResult[]) {
    let active = draft();
    let inspecting = 0;
    let maxInspecting = 0;
    const inspect = jest.fn(async () => {
        inspecting += 1;
        maxInspecting = Math.max(maxInspecting, inspecting);
        const result = results.shift()!;
        inspecting -= 1;
        return result;
    });
    const repository = {
        getActive: jest.fn(async () => active),
        updateMediaValidation: jest.fn(async (_draftId, itemId, validation, updatedAt, expectedUpdatedAt) => {
            if (expectedUpdatedAt !== active.updatedAt) throw new Error('localMediaImport.staleDraft');
            active = {
                ...active,
                updatedAt,
                items: active.items.map(item => (item.id === itemId ? { ...item, ...validation } : item)),
            };
            return active;
        }),
    } as unknown as LocalMediaImportRepository;
    const files = { fileUri: (_namespace: string, draftId: string, filename: string) => `file://${draftId}/${filename}` } as PrivateBatchFiles;
    let time = 10;
    const controller = createValidateLocalMediaController({ repository, files, inspect, now: () => ++time });
    return { controller, inspect, repository, maxInspecting: () => maxInspecting, active: () => active };
}

describe('MOB-FEAT-015 media validation controller', () => {
    it('validates sequentially, persists each result and keeps failures localized', async () => {
        const fixture = setup([
            { status: 'valid', mimeType: 'image/png', width: 100, height: 200 },
            { status: 'invalid', error: 'CORRUPTED', mimeType: 'image/jpeg' },
        ]);
        const progress = jest.fn();

        await expect(fixture.controller.validate(fixture.active(), { onProgress: progress })).resolves.toMatchObject({
            items: [
                { id: 'item-1', mediaValidationStatus: 'VALID', detectedMimeType: 'image/png' },
                { id: 'item-2', mediaValidationStatus: 'INVALID', mediaValidationError: 'CORRUPTED' },
            ],
        });
        expect(fixture.maxInspecting()).toBe(1);
        expect(fixture.repository.updateMediaValidation).toHaveBeenCalledTimes(2);
        expect(progress).toHaveBeenLastCalledWith({ completed: 2, total: 2 });
    });

    it('skips a valid current-policy item and retries only the invalid item', async () => {
        const fixture = setup([
            { status: 'valid', mimeType: 'image/png', width: 100, height: 200 },
            { status: 'invalid', error: 'EMPTY_FILE' },
            { status: 'valid', mimeType: 'image/jpeg', width: 300, height: 400 },
        ]);
        const first = await fixture.controller.validate(fixture.active());
        await fixture.controller.validate(first);

        expect(fixture.inspect).toHaveBeenCalledTimes(3);
        expect(fixture.active().items.every(item => item.mediaValidationStatus === 'VALID')).toBe(true);
    });

    it('coalesces duplicate actions and rejects missing confirmations', async () => {
        const fixture = setup([
            { status: 'valid', mimeType: 'image/png', width: 100, height: 200 },
            { status: 'valid', mimeType: 'image/png', width: 100, height: 200 },
        ]);
        const first = fixture.controller.validate(fixture.active());
        expect(fixture.controller.validate(fixture.active())).toBe(first);
        await first;

        await expect(fixture.controller.validate({ ...fixture.active(), languagesConfirmedAt: null })).rejects.toEqual(
            new ValidateLocalMediaError('prerequisite-required'),
        );
    });
});
