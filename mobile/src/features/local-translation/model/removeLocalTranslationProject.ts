import { type LocalTranslationResultRepository, localTranslationResultRepository, TRANSLATION_RESULT_NAMESPACE } from '@/entities/local-translation-result';
import { TRANSLATION_PROJECT_NAMESPACE } from '@/entities/translation-project';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/shared/files';

interface Dependencies {
    results: LocalTranslationResultRepository;
    files: PrivateBatchFiles;
}

export interface RemoveLocalTranslationProjectController {
    remove(projectId: string): Promise<void>;
}

export function createRemoveLocalTranslationProjectController(dependencies: Dependencies): RemoveLocalTranslationProjectController {
    return {
        async remove(projectId) {
            await dependencies.results.removeProject(projectId);
            await Promise.all([
                dependencies.files.removeBatch(TRANSLATION_RESULT_NAMESPACE, projectId),
                dependencies.files.removeBatch(TRANSLATION_PROJECT_NAMESPACE, projectId),
            ]);
        },
    };
}

export const removeLocalTranslationProjectController = createRemoveLocalTranslationProjectController({
    results: localTranslationResultRepository,
    files: appPrivateBatchFiles,
});
