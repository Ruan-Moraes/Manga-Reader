import { type LocalReadingProgressRepository, localReadingProgressRepository } from '@/entities/local-reading-progress';
import {
    type LocalTranslationResult,
    type LocalTranslationResultRepository,
    localTranslationResultRepository,
    TRANSLATION_RESULT_NAMESPACE,
} from '@/entities/local-translation-result';
import { TRANSLATION_PROJECT_NAMESPACE, type TranslationProject, translationProjectRepository } from '@/entities/translation-project';
import { appPrivateBatchFiles, type PrivateBatchFiles, sha256File } from '@/shared/files';

interface Dependencies {
    projects: Pick<typeof translationProjectRepository, 'getById'>;
    results: LocalTranslationResultRepository;
    progress: LocalReadingProgressRepository;
    files: PrivateBatchFiles;
    hash(uri: string): Promise<string>;
    now(): number;
}

export interface LocalTranslationReaderSnapshot {
    project: TranslationProject;
    results: ReadonlyMap<string, LocalTranslationResult>;
    initialPosition: number;
}

export interface OpenLocalTranslationResultController {
    load(projectId: string): Promise<LocalTranslationReaderSnapshot | null>;
    validate(projectId: string, result: LocalTranslationResult): Promise<boolean>;
    resultUri(projectId: string, result: LocalTranslationResult): string;
    originalUri(project: TranslationProject, position: number): string | null;
}

export function createOpenLocalTranslationResultController(dependencies: Dependencies): OpenLocalTranslationResultController {
    return {
        async load(projectId) {
            const project = await dependencies.projects.getById(projectId);
            if (!project) return null;
            const results = await dependencies.results.listByProject(projectId);
            const saved = await dependencies.progress.get(projectId);
            const initialPosition = saved && project.pages.some(page => page.position === saved.pagePosition) ? saved.pagePosition : 0;
            return { project, results: new Map(results.map(result => [result.pageId, result])), initialPosition };
        },
        async validate(projectId, result) {
            const uri = dependencies.files.fileUri(TRANSLATION_RESULT_NAMESPACE, projectId, result.renderedFilename);
            const exists = await dependencies.files.fileExists(TRANSLATION_RESULT_NAMESPACE, projectId, result.renderedFilename);
            if (exists && (await dependencies.hash(uri)) === result.sha256) return true;
            await dependencies.results.invalidate(result.pageId, dependencies.now());
            return false;
        },
        resultUri(projectId, result) {
            return dependencies.files.fileUri(TRANSLATION_RESULT_NAMESPACE, projectId, result.renderedFilename);
        },
        originalUri(project, position) {
            const page = project.pages.find(candidate => candidate.position === position);
            return page ? dependencies.files.fileUri(TRANSLATION_PROJECT_NAMESPACE, project.id, page.originalFilename) : null;
        },
    };
}

export const openLocalTranslationResultController = createOpenLocalTranslationResultController({
    projects: translationProjectRepository,
    results: localTranslationResultRepository,
    progress: localReadingProgressRepository,
    files: appPrivateBatchFiles,
    hash: sha256File,
    now: Date.now,
});
