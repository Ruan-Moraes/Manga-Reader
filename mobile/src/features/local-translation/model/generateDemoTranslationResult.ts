import { randomUUID } from 'expo-crypto';

import {
    type LocalTranslationResultRepository,
    localTranslationResultRepository,
    type NewLocalTranslationResult,
    TRANSLATION_RESULT_NAMESPACE,
} from '@/entities/local-translation-result';
import {
    TRANSLATION_PROJECT_NAMESPACE,
    type TranslationProject,
    type TranslationProjectRepository,
    translationProjectRepository,
} from '@/entities/translation-project';
import { appPrivateBatchFiles, type PrivateBatchFiles, sha256File } from '@/shared/files';

export const DEMO_PROCESSING_STAGES = ['queue', 'ocr', 'translation', 'rendering', 'saving'] as const;
export type DemoProcessingStage = (typeof DEMO_PROCESSING_STAGES)[number];

export type GenerateDemoResultErrorCode = 'development-only' | 'project-unavailable' | 'original-unavailable' | 'storage-unavailable';

export class GenerateDemoResultError extends Error {
    constructor(readonly code: GenerateDemoResultErrorCode) {
        super(code);
    }
}

interface Dependencies {
    projects: TranslationProjectRepository;
    results: LocalTranslationResultRepository;
    files: PrivateBatchFiles;
    isDevelopment: boolean;
    now(): number;
    uuid(): string;
    hash(uri: string): Promise<string>;
}

export interface GenerateDemoTranslationResultController {
    generate(projectId: string, onStage?: (stage: DemoProcessingStage) => void): Promise<TranslationProject>;
}

const DEMO_TRANSLATIONS: Readonly<Record<string, string>> = {
    ja: 'デモ翻訳',
    en: 'Demo translation',
    es: 'Traducción de demostración',
    ko: '데모 번역',
    'zh-Hans': '演示翻译',
    'zh-Hant': '示範翻譯',
    'pt-BR': 'Tradução de demonstração',
};

export function createGenerateDemoTranslationResultController(dependencies: Dependencies): GenerateDemoTranslationResultController {
    const operations = new Map<string, Promise<TranslationProject>>();
    return {
        generate(projectId, onStage) {
            if (!dependencies.isDevelopment) return Promise.reject(new GenerateDemoResultError('development-only'));
            const active = operations.get(projectId);
            if (active) return active;
            const operation = (async () => {
                onStage?.('queue');
                const project = await dependencies.projects.getById(projectId);
                if (!project?.pages.length) throw new GenerateDemoResultError('project-unavailable');
                const readyAt = Math.max(dependencies.now(), project.updatedAt + 1);
                const stagingId = `${projectId}-demo`;
                const inputs = project.pages.map(page => ({
                    sourceUri: dependencies.files.fileUri(TRANSLATION_PROJECT_NAMESPACE, project.id, page.originalFilename),
                    filename: `demo-${page.id}-${readyAt}`,
                }));
                onStage?.('ocr');
                try {
                    const stored = await dependencies.files.stageBatch(TRANSLATION_RESULT_NAMESPACE, stagingId, inputs);
                    if (stored.some((file, index) => file.byteSize !== project.pages[index]?.originalByteSize)) {
                        throw new GenerateDemoResultError('original-unavailable');
                    }
                    onStage?.('translation');
                    await dependencies.files.promoteStagedFiles(
                        TRANSLATION_RESULT_NAMESPACE,
                        stagingId,
                        project.id,
                        stored.map(file => file.filename),
                    );
                    onStage?.('rendering');
                    const results: NewLocalTranslationResult[] = [];
                    for (const [index, page] of project.pages.entries()) {
                        const file = stored[index];
                        if (!file) throw new GenerateDemoResultError('storage-unavailable');
                        const uri = dependencies.files.fileUri(TRANSLATION_RESULT_NAMESPACE, project.id, file.filename);
                        results.push({
                            pageId: page.id,
                            attemptId: null,
                            sourceKind: 'DEMO',
                            renderedFilename: file.filename,
                            mimeType: page.originalMimeType,
                            byteSize: file.byteSize,
                            widthPx: page.widthPx,
                            heightPx: page.heightPx,
                            sha256: await dependencies.hash(uri),
                            readyAt,
                            autoOpenedAt: null,
                            regions: [
                                {
                                    id: dependencies.uuid(),
                                    pageId: page.id,
                                    readingOrder: 0,
                                    sourceText: 'Demo source text',
                                    translatedText: DEMO_TRANSLATIONS[project.targetLanguage] ?? 'Demo translation',
                                    translationMetadata: null,
                                    overflow: false,
                                    createdAt: readyAt,
                                    vertices: [
                                        { index: 0, x: 0.08, y: 0.08 },
                                        { index: 1, x: 0.92, y: 0.08 },
                                        { index: 2, x: 0.92, y: 0.22 },
                                        { index: 3, x: 0.08, y: 0.22 },
                                    ],
                                },
                            ],
                        });
                    }
                    onStage?.('saving');
                    await dependencies.results.saveDemoResults(project.id, results, readyAt);
                    await dependencies.files.reconcileBatch(TRANSLATION_RESULT_NAMESPACE, project.id, new Set(results.map(result => result.renderedFilename)));
                    const persisted = await dependencies.projects.getById(project.id);
                    if (!persisted) throw new GenerateDemoResultError('storage-unavailable');
                    return persisted;
                } catch (error) {
                    await dependencies.files.discardStaging(TRANSLATION_RESULT_NAMESPACE, stagingId);
                    if (error instanceof GenerateDemoResultError) throw error;
                    throw new GenerateDemoResultError('storage-unavailable');
                }
            })().finally(() => operations.delete(projectId));
            operations.set(projectId, operation);
            return operation;
        },
    };
}

export const generateDemoTranslationResultController = createGenerateDemoTranslationResultController({
    projects: translationProjectRepository,
    results: localTranslationResultRepository,
    files: appPrivateBatchFiles,
    isDevelopment: __DEV__,
    now: Date.now,
    uuid: randomUUID,
    hash: sha256File,
});
