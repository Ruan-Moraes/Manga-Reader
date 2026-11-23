import type { LocalWork, LocalWorkRepository } from '@/entities/local-work';
import type { PrivateBatchFiles } from '@/shared/files';
import type { MediaInspectionResult } from '@/shared/media-inspection';

import { createManageLocalWorksController, LOCAL_WORK_COVER_NAMESPACE } from '../manageLocalWorks';

const work: LocalWork = { id: 'work-1', name: 'Work', coverFilename: 'old-cover', createdAt: 1, updatedAt: 2 };
function fixture() {
    const works: jest.Mocked<LocalWorkRepository> = {
        initialize: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(work),
        list: jest.fn().mockResolvedValue([work]),
        rename: jest.fn().mockResolvedValue(undefined),
        setCoverFilename: jest.fn().mockResolvedValue(undefined),
        attachChapter: jest.fn().mockResolvedValue(undefined),
        listChapters: jest.fn().mockResolvedValue([]),
        listUnassignedProjectIds: jest.fn().mockResolvedValue([]),
        renameChapter: jest.fn().mockResolvedValue(undefined),
        deleteEmpty: jest.fn().mockResolvedValue(undefined),
        deleteWithProjects: jest.fn().mockResolvedValue([]),
        deleteChapter: jest.fn().mockResolvedValue(undefined),
        moveChapter: jest.fn().mockResolvedValue(undefined),
        measureMetadataBytes: jest.fn().mockResolvedValue(5),
        clearMetadata: jest.fn().mockResolvedValue(undefined),
    };
    const files: jest.Mocked<PrivateBatchFiles> = {
        stageBatch: jest.fn().mockResolvedValue([{ filename: 'new-cover', byteSize: 25 }]),
        promoteBatch: jest.fn().mockResolvedValue(undefined),
        promoteStagedFiles: jest.fn().mockResolvedValue(undefined),
        discardStaging: jest.fn().mockResolvedValue(undefined),
        removeFile: jest.fn().mockResolvedValue(undefined),
        removeBatch: jest.fn().mockResolvedValue(undefined),
        clearNamespace: jest.fn().mockResolvedValue(undefined),
        reconcile: jest.fn().mockResolvedValue(undefined),
        reconcileBatch: jest.fn().mockResolvedValue(undefined),
        fileUri: jest.fn().mockReturnValue('file:///private/new-cover'),
        fileExists: jest.fn().mockResolvedValue(false),
        batchExists: jest.fn().mockResolvedValue(false),
        namespaceExists: jest.fn().mockResolvedValue(false),
        fileSize: jest.fn().mockResolvedValue(25),
    };
    const inspect = jest.fn<Promise<MediaInspectionResult>, [string, number]>(async () => ({ status: 'valid', mimeType: 'image/png', width: 5, height: 5 }));
    const uuid = jest.fn().mockReturnValueOnce('staging-1').mockReturnValueOnce('new-cover');
    const controller = createManageLocalWorksController({ works, files, inspect, uuid, now: () => 3 });
    return { works, files, inspect, controller };
}

it('validates a copied cover before publishing its reference and only then removes the previous file', async () => {
    const { works, files, inspect, controller } = fixture();
    const result = await controller.replaceCover(work, 'content://synthetic');
    expect(inspect).toHaveBeenCalledWith('file:///private/new-cover', 25);
    expect(works.setCoverFilename).toHaveBeenCalledWith('work-1', 'new-cover', 2, 3);
    expect(files.removeFile).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, 'work-1', 'old-cover');
    expect(result).toMatchObject({ coverFilename: 'new-cover', updatedAt: 3 });
    expect(inspect.mock.invocationCallOrder[0]).toBeLessThan(works.setCoverFilename.mock.invocationCallOrder[0]);
    expect(works.setCoverFilename.mock.invocationCallOrder[0]).toBeLessThan(files.removeFile.mock.invocationCallOrder[0]);
});

it('preserves the previous cover on validation or stale-write failure', async () => {
    const invalid = fixture();
    invalid.inspect.mockResolvedValueOnce({ status: 'invalid', error: 'CORRUPTED' });
    await expect(invalid.controller.replaceCover(work, 'content://synthetic')).rejects.toThrow('localWork.invalidCover');
    expect(invalid.works.setCoverFilename).not.toHaveBeenCalled();
    expect(invalid.files.removeFile).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, 'work-1', 'new-cover');
    expect(invalid.files.removeFile).not.toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, 'work-1', 'old-cover');

    const stale = fixture();
    stale.works.setCoverFilename.mockRejectedValueOnce(new Error('localWork.notFoundOrStale'));
    await expect(stale.controller.replaceCover(work, 'content://synthetic')).rejects.toThrow('localWork.notFoundOrStale');
    expect(stale.files.removeFile).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, 'work-1', 'new-cover');
    expect(stale.files.removeFile).not.toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, 'work-1', 'old-cover');
});

it('reconciles only files referenced by existing works', async () => {
    const { files, controller } = fixture();
    await controller.initialize();
    expect(files.reconcile).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, new Set(['work-1']));
    expect(files.reconcileBatch).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, 'work-1', new Set(['old-cover']));
});

it('links and renames a chapter using the expected work and chapter versions', async () => {
    const { works, controller } = fixture();
    const updated = await controller.attachChapter(work, 'project-1', 'Chapter 1');
    expect(works.attachChapter).toHaveBeenCalledWith({ projectId: 'project-1', workId: work.id, label: 'Chapter 1', createdAt: 3, updatedAt: 3 }, 2);
    const chapter = { projectId: 'project-1', workId: work.id, label: 'Chapter 1', createdAt: 3, updatedAt: 3 };
    const renamed = await controller.renameChapter(updated, chapter, ' Chapter 2 ');
    expect(works.renameChapter).toHaveBeenCalledWith('project-1', ' Chapter 2 ', 3, 3, 4);
    expect(renamed).toMatchObject({ work: { updatedAt: 4 }, chapter: { label: 'Chapter 2', updatedAt: 4 } });
});

it('attaches a freshly prepared project to its work by id with the current version', async () => {
    const { works, controller } = fixture();
    await controller.attachProjectToWork('work-1', 'project-9', 'Capítulo 9');
    expect(works.attachChapter).toHaveBeenCalledWith({ projectId: 'project-9', workId: 'work-1', label: 'Capítulo 9', createdAt: 3, updatedAt: 3 }, 2);
    works.get.mockResolvedValueOnce(null);
    await expect(controller.attachProjectToWork('gone', 'project-9', 'x')).rejects.toThrow('localWork.notFoundOrStale');
});

it('clears the cover reference before removing its file and rejects collisions', async () => {
    const removed = fixture();
    const updated = await removed.controller.removeCover(work);
    expect(removed.works.setCoverFilename).toHaveBeenCalledWith('work-1', null, 2, 3);
    expect(removed.files.removeFile).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, 'work-1', 'old-cover');
    expect(removed.works.setCoverFilename.mock.invocationCallOrder[0]).toBeLessThan(removed.files.removeFile.mock.invocationCallOrder[0]);
    expect(updated.coverFilename).toBeNull();

    const collision = fixture();
    collision.files.fileExists.mockResolvedValueOnce(true);
    await expect(collision.controller.replaceCover(work, 'content://synthetic')).rejects.toThrow('localWork.coverCollision');
    expect(collision.files.stageBatch).not.toHaveBeenCalled();
    expect(collision.works.setCoverFilename).not.toHaveBeenCalled();
});

it('removes files only after confirmed metadata deletion and reports cleanup errors', async () => {
    const blocked = fixture();
    blocked.works.deleteWithProjects.mockRejectedValueOnce(new Error('localWork.processingActive'));
    await expect(blocked.controller.deleteWork(work)).rejects.toThrow('localWork.processingActive');
    expect(blocked.files.removeBatch).not.toHaveBeenCalled();

    const completed = fixture();
    completed.works.deleteWithProjects.mockResolvedValueOnce(['project-1']);
    completed.files.removeBatch.mockRejectedValueOnce(new Error('disk error'));
    await expect(completed.controller.deleteWork(work)).resolves.toEqual({ cleanupPending: true });
    expect(completed.files.removeBatch).toHaveBeenCalledWith('translation-projects', 'project-1');
    expect(completed.files.removeBatch).toHaveBeenCalledWith('translation-results', 'project-1');
    expect(completed.works.deleteWithProjects.mock.invocationCallOrder[0]).toBeLessThan(completed.files.removeBatch.mock.invocationCallOrder[0]);
});

it('leaves chapter files intact when metadata deletion is blocked', async () => {
    const { works, files, controller } = fixture();
    works.deleteChapter.mockRejectedValueOnce(new Error('localWork.processingActive'));
    await expect(controller.deleteChapter(work, 'project-1')).rejects.toThrow('localWork.processingActive');
    expect(files.removeBatch).not.toHaveBeenCalled();
    await expect(controller.deleteChapter(work, 'project-1')).resolves.toEqual({ cleanupPending: false });
    expect(files.removeBatch).toHaveBeenCalledWith('translation-projects', 'project-1');
    expect(files.removeBatch).toHaveBeenCalledWith('translation-results', 'project-1');
});

it('reports pending cleanup when a directory remains after a suppressed delete failure', async () => {
    const { works, files, controller } = fixture();
    works.deleteWithProjects.mockResolvedValueOnce(['project-1']);
    (files.batchExists as jest.Mock).mockResolvedValueOnce(true);
    await expect(controller.deleteWork(work)).resolves.toEqual({ cleanupPending: true });

    const unverifiable = fixture();
    delete unverifiable.files.batchExists;
    await expect(unverifiable.controller.deleteWork(work)).resolves.toEqual({ cleanupPending: true });
});

it('includes covers in data controls and reports a namespace that could not be cleared', async () => {
    const { works, files, controller } = fixture();
    expect(await controller.measureBytes()).toBe(30);
    expect(files.fileSize).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE, work.id, 'old-cover');
    (files.namespaceExists as jest.Mock).mockResolvedValueOnce(true);
    await expect(controller.clearAll()).rejects.toThrow('localWork.cleanupPending');
    expect(works.clearMetadata).toHaveBeenCalled();
    expect(files.clearNamespace).toHaveBeenCalledWith(LOCAL_WORK_COVER_NAMESPACE);
    works.measureMetadataBytes.mockResolvedValueOnce(0);
    works.list.mockResolvedValueOnce([]);
    (files.namespaceExists as jest.Mock).mockResolvedValueOnce(true);
    expect(await controller.measureBytes()).toBe(1);
});

it('move capítulo para outra obra ou tira da obra sem apagar a tradução (2026-11-10)', async () => {
    const { works, controller } = fixture();
    const other: LocalWork = { id: 'work-2', name: 'Other', coverFilename: null, createdAt: 1, updatedAt: 9 };
    await controller.moveChapter(work, 'project-1', other, '3');
    expect(works.moveChapter).toHaveBeenLastCalledWith('project-1', 'work-1', 'work-2', '3', 2, expect.any(Number));
    expect(works.moveChapter.mock.calls[0][5]).toBeGreaterThan(9);
    await controller.moveChapter(work, 'project-1', null, '');
    expect(works.moveChapter).toHaveBeenLastCalledWith('project-1', 'work-1', null, '', 2, expect.any(Number));
    expect(works.deleteChapter).not.toHaveBeenCalled();
});
