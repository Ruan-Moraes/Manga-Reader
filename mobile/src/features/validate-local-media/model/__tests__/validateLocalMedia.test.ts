import { type LocalMediaImportDraft, type LocalMediaImportRepository, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import type { PrivateBatchFiles } from '@/shared/files';
import type { MediaInspectionResult } from '@/shared/media-inspection';
import type { LocalMediaPicker } from '@/shared/media-picker';

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

    it('replaces one private file and keeps the other validation results intact', async () => {
        const current: LocalMediaImportDraft = {
            ...draft(),
            items: [
                {
                    ...draft().items[0],
                    mediaValidationStatus: 'VALID',
                    detectedMimeType: 'image/png',
                    widthPx: 100,
                    heightPx: 200,
                    validatedAt: 9,
                    validationPolicyVersion: 1,
                },
                { ...draft().items[1], mediaValidationStatus: 'INVALID', mediaValidationError: 'CORRUPTED', validatedAt: 9, validationPolicyVersion: 1 },
            ],
        };
        const next: LocalMediaImportDraft = {
            ...current,
            updatedAt: 11,
            items: [current.items[0], { ...current.items[1], ...PENDING_MEDIA_VALIDATION, localFilename: 'item-2-replacement-1', byteSize: 30 }],
        };
        const picker: LocalMediaPicker = {
            pickImages: jest.fn(async () => ({ status: 'selected' as const, images: [{ uri: 'content://replacement', mimeType: 'image/png', fileSize: 30 }] })),
            getPendingImages: jest.fn(async () => null),
        };
        const files = {
            stageBatch: jest.fn(async () => [{ filename: 'item-2-replacement-1', byteSize: 30 }]),
            promoteStagedFiles: jest.fn(async () => undefined),
            discardStaging: jest.fn(async () => undefined),
            removeFile: jest.fn(async () => undefined),
            fileUri: (_namespace: string, draftId: string, filename: string) => `file://${draftId}/${filename}`,
        } as unknown as PrivateBatchFiles;
        const repository = {
            replaceItem: jest.fn(async () => ({ draft: next, previousFilename: 'two' })),
            getActive: jest.fn(async () => next),
        } as unknown as LocalMediaImportRepository;
        const controller = createValidateLocalMediaController({ repository, files, picker, createId: () => 'replacement-1', now: () => 11 });

        await expect(controller.replaceItem(current, 'item-2')).resolves.toEqual(next);
        expect(picker.pickImages).toHaveBeenCalledWith({ selectionLimit: 1 });
        expect(repository.replaceItem).toHaveBeenCalledWith(
            'draft-1',
            'item-2',
            expect.objectContaining({ localFilename: 'item-2-replacement-1', byteSize: 30 }),
            11,
            10,
        );
        expect(files.removeFile).toHaveBeenCalledWith('local-media-imports', 'draft-1', 'two');
        expect(next.items[0]).toEqual(current.items[0]);
    });
});

describe('MOB-PERF-003 validation snapshot ownership', () => {
    it('keeps the input immutable and matches independently persisted results', async () => {
        const fixture = setup([
            { status: 'valid', mimeType: 'image/png', width: 100, height: 200 },
            { status: 'invalid', error: 'EMPTY_FILE' },
        ]);
        const input = fixture.active();
        input.items.forEach(Object.freeze);
        Object.freeze(input.items);
        Object.freeze(input);
        const output = await fixture.controller.validate(input);
        expect(output).toEqual(await fixture.repository.getActive());
        expect(input.items.every(item => item.mediaValidationStatus === 'PENDING')).toBe(true);
        expect(input.updatedAt).toBe(10);
    });

    it('retains the first committed result when inspection fails on the next item', async () => {
        const fixture = setup([{ status: 'valid', mimeType: 'image/png', width: 100, height: 200 }]);
        fixture.inspect.mockImplementationOnce(async () => ({ status: 'valid', mimeType: 'image/png', width: 100, height: 200 }));
        fixture.inspect.mockImplementationOnce(async () => {
            throw new Error('file unavailable');
        });
        await expect(fixture.controller.validate(fixture.active())).rejects.toMatchObject({ code: 'storage-unavailable' });
        expect((await fixture.controller.reload())?.items.map(item => item.mediaValidationStatus)).toEqual(['VALID', 'PENDING']);
    });
});
