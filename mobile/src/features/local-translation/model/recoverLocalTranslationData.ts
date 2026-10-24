import { localMediaImportRepository } from '@/entities/local-media-import';
import { type LocalTranslationResultRepository, localTranslationResultRepository } from '@/entities/local-translation-result';

export interface RecoverLocalTranslationDataController {
    recover(): Promise<void>;
}

export function createRecoverLocalTranslationDataController(
    results: LocalTranslationResultRepository,
    imports: Pick<typeof localMediaImportRepository, 'initialize'> = localMediaImportRepository,
): RecoverLocalTranslationDataController {
    return {
        async recover() {
            await imports.initialize();
            await results.reconcileFiles();
        },
    };
}

export const recoverLocalTranslationDataController = createRecoverLocalTranslationDataController(localTranslationResultRepository);
