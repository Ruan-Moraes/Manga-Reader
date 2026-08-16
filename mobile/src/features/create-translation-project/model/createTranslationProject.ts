import {
    isMediaValidationReady,
    LOCAL_MEDIA_IMPORT_NAMESPACE,
    type LocalMediaImportDraft,
    type LocalMediaImportRepository,
    localMediaImportRepository,
} from '@/src/entities/local-media-import';
import {
    type NewTranslationProject,
    TRANSLATION_PROJECT_NAMESPACE,
    type TranslationProject,
    type TranslationProjectRepository,
    translationProjectRepository,
} from '@/src/entities/translation-project';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/src/shared/files';
import { MEDIA_VALIDATION_POLICY_VERSION } from '@/src/shared/media-inspection';

export type CreateTranslationProjectErrorCode = 'prerequisite-required' | 'stale-draft' | 'file-copy-failed' | 'storage-unavailable' | 'project-conflict';

export class CreateTranslationProjectError extends Error {
    constructor(readonly code: CreateTranslationProjectErrorCode) {
        super(code);
    }
}

interface Dependencies {
    drafts: LocalMediaImportRepository;
    projects: TranslationProjectRepository;
    files: PrivateBatchFiles;
    now(): number;
}

export interface CreateTranslationProjectController {
    initialize(): Promise<TranslationProject | null>;
    prepare(draft: LocalMediaImportDraft): Promise<TranslationProject>;
}

function snapshotFrom(draft: LocalMediaImportDraft, createdAt: number): NewTranslationProject {
    if (!isMediaValidationReady(draft, MEDIA_VALIDATION_POLICY_VERSION)) {
        throw new CreateTranslationProjectError('prerequisite-required');
    }
    return {
        id: draft.id,
        sourceLanguage: draft.sourceLanguage,
        targetLanguage: draft.targetLanguage,
        status: 'DRAFT',
        createdAt,
        updatedAt: createdAt,
        statusUpdatedAt: createdAt,
        pages: draft.items.map(item => {
            if (!item.detectedMimeType || !item.widthPx || !item.heightPx || !item.validatedAt || !item.validationPolicyVersion) {
                throw new CreateTranslationProjectError('prerequisite-required');
            }
            return {
                id: item.id,
                projectId: draft.id,
                position: item.position,
                originalFilename: item.localFilename,
                originalByteSize: item.byteSize,
                originalMimeType: item.detectedMimeType,
                widthPx: item.widthPx,
                heightPx: item.heightPx,
                mediaValidatedAt: item.validatedAt,
                mediaValidationPolicyVersion: item.validationPolicyVersion,
                status: 'DRAFT',
                createdAt,
                updatedAt: createdAt,
                statusUpdatedAt: createdAt,
            };
        }),
    };
}

function mapRepositoryError(error: unknown): CreateTranslationProjectError {
    if (error instanceof CreateTranslationProjectError) return error;
    if (error instanceof Error && error.message === 'translationProject.projectConflict') {
        return new CreateTranslationProjectError('project-conflict');
    }
    if (error instanceof Error && error.message === 'localMediaImport.staleDraft') {
        return new CreateTranslationProjectError('stale-draft');
    }
    return new CreateTranslationProjectError('storage-unavailable');
}

async function consumeDraft(dependencies: Dependencies, draft: LocalMediaImportDraft): Promise<void> {
    await dependencies.drafts.consumeActive(draft.id, draft.updatedAt);
    await dependencies.files.removeBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id);
}

export function createTranslationProjectController(dependencies: Dependencies): CreateTranslationProjectController {
    let activeOperation: Promise<TranslationProject> | null = null;

    return {
        async initialize() {
            await Promise.all([dependencies.drafts.initialize(), dependencies.projects.initialize()]);
            const referenced = await dependencies.projects.getReferencedProjectIds();
            await dependencies.files.reconcile(TRANSLATION_PROJECT_NAMESPACE, referenced);
            const activeDraft = await dependencies.drafts.getActive();
            if (activeDraft && referenced.has(activeDraft.id)) {
                try {
                    const snapshot = snapshotFrom(activeDraft, Math.max(dependencies.now(), activeDraft.updatedAt));
                    await dependencies.projects.create(snapshot);
                    await consumeDraft(dependencies, activeDraft);
                } catch {
                    // O projeto durável permanece íntegro; conflito/stale exige ação explícita.
                }
            }
            return dependencies.projects.getLatest();
        },
        prepare(draft) {
            if (activeOperation) return activeOperation;
            activeOperation = (async () => {
                const snapshot = snapshotFrom(draft, Math.max(dependencies.now(), draft.updatedAt + 1));
                const existing = await dependencies.projects.getById(draft.id).catch(error => {
                    throw mapRepositoryError(error);
                });
                if (existing) {
                    const result = await dependencies.projects.create(snapshot).catch(error => {
                        throw mapRepositoryError(error);
                    });
                    await consumeDraft(dependencies, draft).catch(error => {
                        throw mapRepositoryError(error);
                    });
                    return result.project;
                }

                try {
                    const copied = await dependencies.files.stageBatch(
                        TRANSLATION_PROJECT_NAMESPACE,
                        draft.id,
                        draft.items.map(item => ({
                            sourceUri: dependencies.files.fileUri(LOCAL_MEDIA_IMPORT_NAMESPACE, draft.id, item.localFilename),
                            filename: item.localFilename,
                        })),
                    );
                    if (copied.some((file, index) => file.byteSize !== draft.items[index]?.byteSize)) {
                        throw new CreateTranslationProjectError('file-copy-failed');
                    }
                    await dependencies.files.promoteBatch(TRANSLATION_PROJECT_NAMESPACE, draft.id);
                } catch (error) {
                    await dependencies.files.discardStaging(TRANSLATION_PROJECT_NAMESPACE, draft.id);
                    if (error instanceof CreateTranslationProjectError) throw error;
                    throw new CreateTranslationProjectError('file-copy-failed');
                }

                try {
                    const result = await dependencies.projects.create(snapshot);
                    await consumeDraft(dependencies, draft);
                    return result.project;
                } catch (error) {
                    const persisted = await dependencies.projects.getById(draft.id).catch(() => null);
                    if (!persisted) await dependencies.files.removeBatch(TRANSLATION_PROJECT_NAMESPACE, draft.id);
                    throw mapRepositoryError(error);
                }
            })().finally(() => {
                activeOperation = null;
            });
            return activeOperation;
        },
    };
}

export const translationProjectController = createTranslationProjectController({
    drafts: localMediaImportRepository,
    projects: translationProjectRepository,
    files: appPrivateBatchFiles,
    now: Date.now,
});
