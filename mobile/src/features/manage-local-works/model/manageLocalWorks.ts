import { TRANSLATION_RESULT_NAMESPACE } from '@/entities/local-translation-result';
import { type LocalWork, type LocalWorkChapter, type LocalWorkRepository, localWorkRepository } from '@/entities/local-work';
import { TRANSLATION_PROJECT_NAMESPACE } from '@/entities/translation-project';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/shared/files';
import { randomUuid } from '@/shared/lib';
import { inspectLocalImage, type MediaInspectionResult } from '@/shared/media-inspection';
import { registerLocalDataParticipant } from '@/shared/storage';

export const LOCAL_WORK_COVER_NAMESPACE = 'local-work-covers';

interface Dependencies {
    works: LocalWorkRepository;
    files: PrivateBatchFiles;
    inspect(uri: string, expectedSize: number): Promise<MediaInspectionResult>;
    uuid(): string;
    now(): number;
}
export interface ManageLocalWorksController {
    initialize(): Promise<LocalWork[]>;
    coverUri(work: LocalWork): string | null;
    create(name: string): Promise<LocalWork>;
    rename(work: LocalWork, name: string): Promise<LocalWork>;
    replaceCover(work: LocalWork, sourceUri: string): Promise<LocalWork>;
    removeCover(work: LocalWork): Promise<LocalWork>;
    listChapters(workId: string): Promise<LocalWorkChapter[]>;
    listUnassignedProjectIds(): Promise<string[]>;
    attachChapter(work: LocalWork, projectId: string, label: string): Promise<LocalWork>;
    attachProjectToWork(workId: string, projectId: string, label: string): Promise<void>;
    renameChapter(work: LocalWork, chapter: LocalWorkChapter, label: string): Promise<{ work: LocalWork; chapter: LocalWorkChapter }>;
    deleteWork(work: LocalWork): Promise<{ cleanupPending: boolean }>;
    deleteChapter(work: LocalWork, projectId: string): Promise<{ cleanupPending: boolean }>;
    /** Moves a chapter to `target`, or makes it "Sem obra" when `target` is null; the translation is kept. */
    moveChapter(work: LocalWork, projectId: string, target: LocalWork | null, label: string): Promise<void>;
    measureBytes(): Promise<number>;
    clearAll(): Promise<void>;
}
export function createManageLocalWorksController(dependencies: Dependencies): ManageLocalWorksController {
    let queue: Promise<void> = Promise.resolve();
    const run = <T>(task: () => Promise<T>): Promise<T> => {
        const operation = queue.then(task, task);
        queue = operation.then(
            () => undefined,
            () => undefined,
        );
        return operation;
    };
    const nextTime = (work: LocalWork) => Math.max(dependencies.now(), work.updatedAt + 1);
    const cleanupBatches = async (targets: readonly { namespace: string; id: string }[]) => {
        const cleanup = await Promise.allSettled(targets.map(target => dependencies.files.removeBatch(target.namespace, target.id)));
        if (cleanup.some(result => result.status === 'rejected') || !dependencies.files.batchExists) return { cleanupPending: true };
        const verify = await Promise.allSettled(targets.map(target => dependencies.files.batchExists!(target.namespace, target.id)));
        return { cleanupPending: verify.some(result => result.status === 'rejected' || result.value) };
    };
    return {
        coverUri: work => (work.coverFilename ? dependencies.files.fileUri(LOCAL_WORK_COVER_NAMESPACE, work.id, work.coverFilename) : null),
        initialize: () =>
            run(async () => {
                await dependencies.works.initialize();
                const works = await dependencies.works.list();
                await dependencies.files.reconcile(LOCAL_WORK_COVER_NAMESPACE, new Set(works.map(work => work.id)));
                for (const work of works) {
                    await dependencies.files.reconcileBatch(LOCAL_WORK_COVER_NAMESPACE, work.id, new Set(work.coverFilename ? [work.coverFilename] : []));
                }
                return works;
            }),
        create: name =>
            run(async () => {
                const now = dependencies.now();
                const work: LocalWork = { id: dependencies.uuid(), name, coverFilename: null, createdAt: now, updatedAt: now };
                await dependencies.works.create(work);
                return { ...work, name: work.name.trim() };
            }),
        rename: (work, name) =>
            run(async () => {
                const updatedAt = nextTime(work);
                await dependencies.works.rename(work.id, name, work.updatedAt, updatedAt);
                return { ...work, name: name.trim(), updatedAt };
            }),
        replaceCover: (work, sourceUri) =>
            run(async () => {
                if (!sourceUri.trim()) throw new Error('localWork.invalidCover');
                const stagingId = dependencies.uuid();
                const filename = dependencies.uuid();
                if (filename === work.coverFilename || (await dependencies.files.fileExists(LOCAL_WORK_COVER_NAMESPACE, work.id, filename)))
                    throw new Error('localWork.coverCollision');
                let promoted = false;
                let committed = false;
                try {
                    const copied = await dependencies.files.stageBatch(LOCAL_WORK_COVER_NAMESPACE, stagingId, [{ sourceUri, filename }]);
                    if (copied.length !== 1 || copied[0].filename !== filename || copied[0].byteSize <= 0) throw new Error('localWork.invalidCover');
                    await dependencies.files.promoteStagedFiles(LOCAL_WORK_COVER_NAMESPACE, stagingId, work.id, [filename]);
                    promoted = true;
                    const uri = dependencies.files.fileUri(LOCAL_WORK_COVER_NAMESPACE, work.id, filename);
                    if ((await dependencies.inspect(uri, copied[0].byteSize)).status !== 'valid') throw new Error('localWork.invalidCover');
                    const updatedAt = nextTime(work);
                    await dependencies.works.setCoverFilename(work.id, filename, work.updatedAt, updatedAt);
                    committed = true;
                    if (work.coverFilename) await dependencies.files.removeFile(LOCAL_WORK_COVER_NAMESPACE, work.id, work.coverFilename).catch(() => undefined);
                    return { ...work, coverFilename: filename, updatedAt };
                } finally {
                    if (!committed && promoted) await dependencies.files.removeFile(LOCAL_WORK_COVER_NAMESPACE, work.id, filename).catch(() => undefined);
                    await dependencies.files.discardStaging(LOCAL_WORK_COVER_NAMESPACE, stagingId).catch(() => undefined);
                }
            }),
        removeCover: work =>
            run(async () => {
                if (!work.coverFilename) return work;
                const updatedAt = nextTime(work);
                await dependencies.works.setCoverFilename(work.id, null, work.updatedAt, updatedAt);
                await dependencies.files.removeFile(LOCAL_WORK_COVER_NAMESPACE, work.id, work.coverFilename).catch(() => undefined);
                return { ...work, coverFilename: null, updatedAt };
            }),
        listChapters: workId => run(() => dependencies.works.listChapters(workId)),
        listUnassignedProjectIds: () => run(() => dependencies.works.listUnassignedProjectIds()),
        attachChapter: (work, projectId, label) =>
            run(async () => {
                const updatedAt = nextTime(work);
                await dependencies.works.attachChapter({ projectId, workId: work.id, label, createdAt: updatedAt, updatedAt }, work.updatedAt);
                return { ...work, updatedAt };
            }),
        moveChapter: (work, projectId, target, label) =>
            run(async () => {
                const updatedAt = Math.max(nextTime(work), target ? target.updatedAt + 1 : 0);
                await dependencies.works.moveChapter(projectId, work.id, target?.id ?? null, label, work.updatedAt, updatedAt);
            }),
        attachProjectToWork: (workId, projectId, label) =>
            run(async () => {
                const work = await dependencies.works.get(workId);
                if (!work) throw new Error('localWork.notFoundOrStale');
                const updatedAt = nextTime(work);
                await dependencies.works.attachChapter({ projectId, workId, label, createdAt: updatedAt, updatedAt }, work.updatedAt);
            }),
        renameChapter: (work, chapter, label) =>
            run(async () => {
                if (chapter.workId !== work.id) throw new Error('localWork.invalidChapter');
                const updatedAt = Math.max(dependencies.now(), work.updatedAt + 1, chapter.updatedAt + 1);
                await dependencies.works.renameChapter(chapter.projectId, label, chapter.updatedAt, work.updatedAt, updatedAt);
                return { work: { ...work, updatedAt }, chapter: { ...chapter, label: label.trim(), updatedAt } };
            }),
        deleteWork: work =>
            run(async () => {
                const projectIds = await dependencies.works.deleteWithProjects(work.id, work.updatedAt);
                return cleanupBatches([
                    { namespace: LOCAL_WORK_COVER_NAMESPACE, id: work.id },
                    ...projectIds.flatMap(id => [
                        { namespace: TRANSLATION_PROJECT_NAMESPACE, id },
                        { namespace: TRANSLATION_RESULT_NAMESPACE, id },
                    ]),
                ]);
            }),
        deleteChapter: (work, projectId) =>
            run(async () => {
                await dependencies.works.deleteChapter(work.id, projectId, work.updatedAt, nextTime(work));
                return cleanupBatches([
                    { namespace: TRANSLATION_PROJECT_NAMESPACE, id: projectId },
                    { namespace: TRANSLATION_RESULT_NAMESPACE, id: projectId },
                ]);
            }),
        measureBytes: () =>
            run(async () => {
                const metadata = await dependencies.works.measureMetadataBytes();
                const works = await dependencies.works.list();
                if (!dependencies.files.fileSize) return metadata;
                const sizes = await Promise.all(
                    works.flatMap(work => (work.coverFilename ? [dependencies.files.fileSize!(LOCAL_WORK_COVER_NAMESPACE, work.id, work.coverFilename)] : [])),
                );
                const measured = metadata + sizes.reduce((sum, size) => sum + size, 0);
                if (measured === 0 && dependencies.files.namespaceExists && (await dependencies.files.namespaceExists(LOCAL_WORK_COVER_NAMESPACE))) return 1;
                return measured;
            }),
        clearAll: () =>
            run(async () => {
                await dependencies.works.clearMetadata();
                await dependencies.files.clearNamespace(LOCAL_WORK_COVER_NAMESPACE);
                if (!dependencies.files.namespaceExists || (await dependencies.files.namespaceExists(LOCAL_WORK_COVER_NAMESPACE)))
                    throw new Error('localWork.cleanupPending');
            }),
    };
}
export const manageLocalWorksController = createManageLocalWorksController({
    works: localWorkRepository,
    files: appPrivateBatchFiles,
    inspect: inspectLocalImage,
    uuid: randomUuid,
    now: Date.now,
});

export function registerLocalWorkDataParticipant(): () => void {
    return registerLocalDataParticipant({
        id: 'local-works',
        measureBytes: () => manageLocalWorksController.measureBytes(),
        clear: () => manageLocalWorksController.clearAll(),
    });
}
