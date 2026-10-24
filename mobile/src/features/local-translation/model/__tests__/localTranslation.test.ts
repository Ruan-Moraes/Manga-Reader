import type { LocalReadingProgressRepository } from '@/entities/local-reading-progress';
import type { LocalTranslationResultRepository } from '@/entities/local-translation-result';
import type { TranslationProject, TranslationProjectRepository } from '@/entities/translation-project';
import type { PrivateBatchFiles } from '@/shared/files';

import { createGenerateDemoTranslationResultController, GenerateDemoResultError } from '../generateDemoTranslationResult';
import { createRecoverLocalTranslationDataController } from '../recoverLocalTranslationData';
import { createRemoveLocalTranslationProjectController } from '../removeLocalTranslationProject';
import { createTrackLocalReadingProgressController } from '../trackLocalReadingProgress';

const project: TranslationProject = {
    id: 'project-1',
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    status: 'DRAFT',
    createdAt: 10,
    updatedAt: 10,
    statusUpdatedAt: 10,
    languageReviewRequired: false,
    pages: [
        {
            id: 'page-1',
            projectId: 'project-1',
            position: 0,
            originalFilename: 'page-1.jpg',
            originalByteSize: 25,
            originalMimeType: 'image/jpeg',
            widthPx: 800,
            heightPx: 1200,
            mediaValidatedAt: 10,
            mediaValidationPolicyVersion: 1,
            status: 'DRAFT',
            createdAt: 10,
            updatedAt: 10,
            statusUpdatedAt: 10,
        },
    ],
};

function files(): jest.Mocked<PrivateBatchFiles> {
    return {
        stageBatch: jest.fn().mockResolvedValue([{ filename: 'demo-page-1-20', byteSize: 25 }]),
        promoteBatch: jest.fn().mockResolvedValue(undefined),
        promoteStagedFiles: jest.fn().mockResolvedValue(undefined),
        discardStaging: jest.fn().mockResolvedValue(undefined),
        removeFile: jest.fn().mockResolvedValue(undefined),
        removeBatch: jest.fn().mockResolvedValue(undefined),
        clearNamespace: jest.fn().mockResolvedValue(undefined),
        reconcile: jest.fn().mockResolvedValue(undefined),
        reconcileBatch: jest.fn().mockResolvedValue(undefined),
        fileUri: jest.fn((namespace, batch, filename) => `file:///${namespace}/${batch}/${filename}`),
        fileExists: jest.fn().mockResolvedValue(true),
    };
}

function projects(): jest.Mocked<TranslationProjectRepository> {
    return {
        initialize: jest.fn().mockResolvedValue(undefined),
        create: jest.fn(),
        getById: jest
            .fn()
            .mockResolvedValueOnce(project)
            .mockResolvedValue({ ...project, status: 'READY', pages: [{ ...project.pages[0], status: 'READY' }] }),
        listAll: jest.fn(),
        getLatest: jest.fn(),
        transitionPage: jest.fn(),
        transitionProject: jest.fn(),
        getReferencedProjectIds: jest.fn(),
        measureBytes: jest.fn(),
        clear: jest.fn(),
    };
}

function results(): jest.Mocked<LocalTranslationResultRepository> {
    return {
        initialize: jest.fn(),
        saveDemoResults: jest.fn().mockResolvedValue(undefined),
        getByPage: jest.fn(),
        listByProject: jest.fn(),
        listLibrary: jest.fn(),
        markAutoOpened: jest.fn(),
        invalidate: jest.fn(),
        removeProject: jest.fn().mockResolvedValue(undefined),
        reconcileFiles: jest.fn(),
        measureBytes: jest.fn(),
        clear: jest.fn(),
    };
}

describe('MOB-FEAT-050 local translation simulator', () => {
    it('refuses execution outside development before reading local data', async () => {
        const projectRepository = projects();
        const controller = createGenerateDemoTranslationResultController({
            projects: projectRepository,
            results: results(),
            files: files(),
            isDevelopment: false,
            now: () => 20,
            uuid: () => 'region-1',
            hash: jest.fn(),
        });

        await expect(controller.generate(project.id)).rejects.toEqual(new GenerateDemoResultError('development-only'));
        expect(projectRepository.getById).not.toHaveBeenCalled();
    });

    it('copies, hashes and persists a deterministic demo result through all stages', async () => {
        const fileAdapter = files();
        const resultRepository = results();
        const stages: string[] = [];
        const controller = createGenerateDemoTranslationResultController({
            projects: projects(),
            results: resultRepository,
            files: fileAdapter,
            isDevelopment: true,
            now: () => 20,
            uuid: () => 'region-1',
            hash: jest.fn().mockResolvedValue('a'.repeat(64)),
        });

        await expect(controller.generate(project.id, stage => stages.push(stage))).resolves.toEqual(expect.objectContaining({ status: 'READY' }));
        expect(stages).toEqual(['queue', 'ocr', 'translation', 'rendering', 'saving']);
        expect(resultRepository.saveDemoResults).toHaveBeenCalledWith(
            project.id,
            [expect.objectContaining({ pageId: 'page-1', sourceKind: 'DEMO', sha256: 'a'.repeat(64) })],
            20,
        );
        expect(fileAdapter.reconcileBatch).toHaveBeenCalledWith('translation-results', project.id, new Set(['demo-page-1-20']));
    });

    it('coalesces concurrent generation for the same project', async () => {
        const controller = createGenerateDemoTranslationResultController({
            projects: projects(),
            results: results(),
            files: files(),
            isDevelopment: true,
            now: () => 20,
            uuid: () => 'region-1',
            hash: jest.fn().mockResolvedValue('a'.repeat(64)),
        });

        const first = controller.generate(project.id);
        const second = controller.generate(project.id);

        expect(second).toBe(first);
        await expect(first).resolves.toEqual(expect.objectContaining({ status: 'READY' }));
    });
});

describe('MOB-FEAT-025/026 local lifecycle controllers', () => {
    it('deletes metadata before both private file batches', async () => {
        const order: string[] = [];
        const resultRepository = results();
        resultRepository.removeProject.mockImplementation(async () => {
            order.push('database');
        });
        const fileAdapter = files();
        fileAdapter.removeBatch.mockImplementation(async namespace => {
            order.push(namespace);
        });

        await createRemoveLocalTranslationProjectController({ results: resultRepository, files: fileAdapter }).remove(project.id);
        expect(order).toEqual(['database', 'translation-results', 'translation-projects']);
    });

    it('loads and writes monotonic local positions without account state', async () => {
        const progress: jest.Mocked<LocalReadingProgressRepository> = {
            get: jest.fn().mockResolvedValue({ projectId: project.id, pagePosition: 2, updatedAt: 10 }),
            save: jest.fn().mockResolvedValue(undefined),
        };
        const controller = createTrackLocalReadingProgressController({ progress, now: () => 30 });
        await expect(controller.load(project.id)).resolves.toBe(2);
        await controller.save(project.id, 3);
        expect(progress.save).toHaveBeenCalledWith({ projectId: project.id, pagePosition: 3, updatedAt: 30 });
    });
});

describe('MOB-FEAT-027 local recovery ordering', () => {
    it('repairs imported metadata before reconciling translation results', async () => {
        const order: string[] = [];
        const resultRepository = results();
        resultRepository.reconcileFiles.mockImplementation(async () => {
            order.push('results');
        });
        const controller = createRecoverLocalTranslationDataController(resultRepository, {
            initialize: jest.fn(async () => {
                order.push('imports');
            }),
        });

        await controller.recover();

        expect(order).toEqual(['imports', 'results']);
    });
});
