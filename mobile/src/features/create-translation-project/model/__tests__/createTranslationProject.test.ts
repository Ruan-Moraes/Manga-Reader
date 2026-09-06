import { type LocalMediaImportDraft, type LocalMediaImportRepository, PENDING_MEDIA_VALIDATION } from '@/entities/local-media-import';
import type { TranslationProject, TranslationProjectRepository } from '@/entities/translation-project';
import type { PrivateBatchFiles } from '@/shared/files';

import { createTranslationProjectController, CreateTranslationProjectError } from '../createTranslationProject';

function validDraft(): LocalMediaImportDraft {
    return {
        id: 'draft-1',
        createdAt: 10,
        updatedAt: 20,
        confirmedAt: 11,
        sourceLanguage: 'ko',
        targetLanguage: 'pt-BR',
        languagesConfirmedAt: 12,
        items: [
            {
                ...PENDING_MEDIA_VALIDATION,
                id: 'page-1',
                position: 0,
                localFilename: 'page-1.jpg',
                byteSize: 42,
                mimeHint: 'image/jpeg',
                createdAt: 10,
                mediaValidationStatus: 'VALID',
                detectedMimeType: 'image/jpeg',
                widthPx: 800,
                heightPx: 1200,
                validatedAt: 20,
                validationPolicyVersion: 1,
            },
        ],
    };
}

function fixture() {
    let active: LocalMediaImportDraft | null = validDraft();
    let project: TranslationProject | null = null;
    const drafts: LocalMediaImportRepository = {
        initialize: jest.fn(async () => undefined),
        getActive: jest.fn(async () => active),
        replaceActive: jest.fn(),
        appendItems: jest.fn(),
        replaceItem: jest.fn(),
        removeItem: jest.fn(),
        reorderItems: jest.fn(),
        confirm: jest.fn(),
        updateLanguages: jest.fn(),
        confirmLanguages: jest.fn(),
        updateMediaValidation: jest.fn(),
        getReferencedDraftIds: jest.fn(async () => new Set(active ? [active.id] : [])),
        measureBytes: jest.fn(async () => 0),
        clear: jest.fn(async () => undefined),
        consumeActive: jest.fn(async (id, expectedUpdatedAt) => {
            if (!active || active.id !== id || active.updatedAt !== expectedUpdatedAt) throw new Error('localMediaImport.staleDraft');
            active = null;
        }),
    };
    const projects: TranslationProjectRepository = {
        initialize: jest.fn(async () => undefined),
        create: jest.fn(async snapshot => {
            if (project) return { project, created: false };
            project = { ...snapshot, languageReviewRequired: false };
            return { project, created: true };
        }),
        getById: jest.fn(async id => (project?.id === id ? project : null)),
        getLatest: jest.fn(async () => project),
        transitionPage: jest.fn(),
        transitionProject: jest.fn(),
        getReferencedProjectIds: jest.fn(async () => new Set(project ? [project.id] : [])),
        measureBytes: jest.fn(async () => project?.pages.reduce((sum, page) => sum + page.originalByteSize, 0) ?? 0),
        clear: jest.fn(async () => undefined),
    };
    const files: PrivateBatchFiles = {
        stageBatch: jest.fn(async (_namespace, _id, inputs) => inputs.map(input => ({ filename: input.filename, byteSize: 42 }))),
        promoteBatch: jest.fn(async () => undefined),
        promoteStagedFiles: jest.fn(async () => undefined),
        discardStaging: jest.fn(async () => undefined),
        removeFile: jest.fn(async () => undefined),
        removeBatch: jest.fn(async () => undefined),
        clearNamespace: jest.fn(async () => undefined),
        reconcile: jest.fn(async () => undefined),
        reconcileBatch: jest.fn(async () => undefined),
        fileUri: jest.fn((namespace, id, filename) => `file:///private/${namespace}/${id}/${filename}`),
        fileExists: jest.fn(async () => true),
    };
    const controller = createTranslationProjectController({ drafts, projects, files, now: () => 30 });
    return { controller, drafts, projects, files, active: () => active, project: () => project };
}

describe('MOB-FEAT-016 project creation', () => {
    it('copies originals, persists a stable DRAFT snapshot and only then consumes the source draft', async () => {
        const test = fixture();
        const result = await test.controller.prepare(validDraft());

        expect(result).toMatchObject({
            id: 'draft-1',
            sourceLanguage: 'ko',
            targetLanguage: 'pt-BR',
            status: 'DRAFT',
            pages: [{ id: 'page-1', position: 0, status: 'DRAFT', originalMimeType: 'image/jpeg' }],
        });
        const promoteOrder = (test.files.promoteBatch as jest.Mock).mock.invocationCallOrder[0];
        const createOrder = (test.projects.create as jest.Mock).mock.invocationCallOrder[0];
        const consumeOrder = (test.drafts.consumeActive as jest.Mock).mock.invocationCallOrder[0];
        expect(promoteOrder).toBeLessThan(createOrder);
        expect(createOrder).toBeLessThan(consumeOrder);
        expect(test.active()).toBeNull();
    });

    it('rejects a non-ready draft before copying or persistence', async () => {
        const test = fixture();
        const pending = validDraft();
        pending.items[0] = { ...pending.items[0], mediaValidationStatus: 'PENDING', detectedMimeType: null, widthPx: null, heightPx: null };

        await expect(test.controller.prepare(pending)).rejects.toEqual(new CreateTranslationProjectError('prerequisite-required'));
        expect(test.files.stageBatch).not.toHaveBeenCalled();
        expect(test.projects.create).not.toHaveBeenCalled();
    });

    it('removes promoted files after a database failure while preserving the draft', async () => {
        const test = fixture();
        (test.projects.create as jest.Mock).mockRejectedValueOnce(new Error('database-down'));

        await expect(test.controller.prepare(validDraft())).rejects.toEqual(new CreateTranslationProjectError('storage-unavailable'));
        expect(test.files.removeBatch).toHaveBeenCalledWith('translation-projects', 'draft-1');
        expect(test.active()).not.toBeNull();
    });

    it('recovers cleanup when a durable equivalent project and its draft coexist after restart', async () => {
        const test = fixture();
        await test.controller.prepare(validDraft());
        const recovered = fixture();
        (recovered.projects.getReferencedProjectIds as jest.Mock).mockResolvedValue(new Set(['draft-1']));
        (recovered.projects.create as jest.Mock).mockResolvedValue({ project: test.project(), created: false });

        await expect(recovered.controller.initialize()).resolves.toBeNull();
        expect(recovered.drafts.consumeActive).toHaveBeenCalledWith('draft-1', 20);
        expect(recovered.files.removeBatch).toHaveBeenCalledWith('local-media-imports', 'draft-1');
    });

    it('shares one operation for repeated taps', async () => {
        const test = fixture();
        const first = test.controller.prepare(validDraft());
        const second = test.controller.prepare(validDraft());
        expect(second).toBe(first);
        await expect(first).resolves.toMatchObject({ id: 'draft-1' });
        expect(test.projects.create).toHaveBeenCalledTimes(1);
    });
});
