import {
    type LocalTranslationResultRepository,
    localTranslationResultRepository,
    parseRenderedTranslationManifest,
    type RemoteRenderedResultRepository,
    remoteRenderedResultRepository,
    withLocalTranslationResultFiles,
} from '@/entities/local-translation-result';
import {
    type RemoteProcessingAttemptRepository,
    remoteProcessingAttemptRepository,
    takeVolatileDelivery,
    type VolatileDelivery,
} from '@/entities/remote-processing-attempt';
import { type TranslationProjectRepository, translationProjectRepository } from '@/entities/translation-project';
import { sha256Bytes } from '@/shared/files';

import { originalPageHash, stageAcquisition, validateAcquiredFile } from '../api/acquisitionFiles';

export interface AcquisitionDependencies {
    attempts: Pick<RemoteProcessingAttemptRepository, 'getById' | 'getProjectIdForPage' | 'failVolatileAttempt'>;
    projects: Pick<TranslationProjectRepository, 'getById'>;
    results: Pick<LocalTranslationResultRepository, 'getByPage' | 'invalidate'>;
    writer: RemoteRenderedResultRepository;
    takeDelivery: typeof takeVolatileDelivery;
    withFiles: typeof withLocalTranslationResultFiles;
    hashBytes: typeof sha256Bytes;
    originalHash: typeof originalPageHash;
    stage: typeof stageAcquisition;
    validateStored: typeof validateAcquiredFile;
    now(): number;
}
export interface AcquisitionSnapshot {
    status: 'waiting' | 'ready' | 'failed' | 'cancelled';
    stage: number;
    projectId: string | null;
    pageId: string | null;
    error: string | null;
    empty?: boolean;
}
export interface AcquireRemoteTranslationResultController {
    run(attemptId: string, signal?: AbortSignal, onProgress?: (snapshot: AcquisitionSnapshot) => void): Promise<AcquisitionSnapshot>;
    claimOpen(pageId: string, signal?: AbortSignal): Promise<boolean>;
}
const MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_BYTES = 64 * 1024 * 1024;
export function createAcquireRemoteTranslationResultController(d: AcquisitionDependencies): AcquireRemoteTranslationResultController {
    const pending = new Map<string, Promise<AcquisitionSnapshot>>();
    const execute = async (attemptId: string, signal?: AbortSignal, onProgress?: (snapshot: AcquisitionSnapshot) => void): Promise<AcquisitionSnapshot> =>
        d.withFiles(async () => {
            const state: AcquisitionSnapshot = { status: 'waiting', stage: -1, projectId: null, pageId: null, error: null };
            const fence = new AbortController();
            const abandon = () => fence.abort();
            signal?.addEventListener('abort', abandon, { once: true });
            let stage: Awaited<ReturnType<typeof stageAcquisition>> | undefined,
                delivery: VolatileDelivery | null = null,
                committed = false,
                retainPromoted = false;
            const active = () => {
                if (signal?.aborted || delivery?.signal.aborted || fence.signal.aborted) {
                    fence.abort();
                    throw new Error('localTranslation.acquisitionCancelled');
                }
            };
            try {
                const attempt = await d.attempts.getById(attemptId);
                if (!attempt) return state;
                state.pageId = attempt.pageId;
                state.projectId = await d.attempts.getProjectIdForPage(attempt.pageId);
                if (!state.projectId) return state;
                const project = await d.projects.getById(state.projectId);
                if (!project) return state;
                active();
                const stored = await d.results.getByPage(attempt.pageId);
                active();
                if (stored) {
                    if (stored.sourceKind !== 'REMOTE' || stored.attemptId !== attempt.id) throw new Error('localTranslation.invalidRemoteManifest');
                    // An inspection failure is not proof that a durable result is corrupt.
                    committed = true;
                    const valid = await d.validateStored(project.id, stored.renderedFilename, stored.sha256);
                    active();
                    if (!valid) {
                        await d.results.invalidate(attempt.pageId, d.now());
                        committed = false;
                        throw new Error('localTranslation.invalidRemoteManifest');
                    }
                    active();
                    return { ...state, status: 'ready', stage: 1, empty: stored.regions?.length === 0 };
                }
                if (attempt.status === 'CANCELLED' || attempt.status === 'CANCEL_PENDING') return { ...state, status: 'cancelled' };
                if (attempt.status !== 'ACCEPTED') return { ...state, status: 'failed', error: 'localTranslation.deliveryLost' };
                delivery = d.takeDelivery(attempt.id);
                if (!delivery) throw new Error('localTranslation.deliveryLost');
                delivery.signal.addEventListener('abort', abandon, { once: true });
                active();
                if (
                    attempt.gatewayContractVersion !== '2.0' ||
                    attempt.volatileReceiptStatus !== 'FINISHED' ||
                    delivery.attemptId !== attempt.id ||
                    delivery.operationRef !== attempt.remoteJobRef
                )
                    throw new Error('localTranslation.invalidRemoteManifest');
                const page = project.pages.find(p => p.id === attempt.pageId);
                if (!page) throw new Error('localTranslation.invalidRemoteManifest');
                state.stage = 0;
                onProgress?.({ ...state });
                const sourceHash = await d.originalHash(project, attempt.pageId);
                active();
                if (sourceHash !== delivery.originalSha256) throw new Error('localTranslation.invalidRemoteManifest');
                const { manifest: manifestBytes, image: imageBytes } = delivery.bytes;
                if (!manifestBytes.length || manifestBytes.length > MAX_MANIFEST_BYTES || !imageBytes.length || imageBytes.length > MAX_IMAGE_BYTES)
                    throw new Error('localTranslation.invalidRemoteManifest');
                const imageHash = await d.hashBytes(imageBytes);
                active();
                const manifest = parseRenderedTranslationManifest(manifestBytes, {
                    jobRef: delivery.operationRef,
                    sourceLanguage: project.sourceLanguage,
                    targetLanguage: project.targetLanguage,
                    originalSha256: sourceHash,
                    image: { mimeType: 'image/webp', byteSize: imageBytes.length, sha256: imageHash, widthPx: page.widthPx, heightPx: page.heightPx },
                });
                active();
                stage = await d.stage(project.id, manifest, imageBytes, manifestBytes);
                active();
                await stage.promote();
                active();
                await stage.validate();
                active();
                if ((await d.originalHash(project, attempt.pageId)) !== sourceHash) throw new Error('localTranslation.invalidRemoteManifest');
                active();
                try {
                    committed = await d.writer.commit({
                        projectId: project.id,
                        pageId: attempt.pageId,
                        attemptId: attempt.id,
                        manifest,
                        renderedFilename: stage.renderedFilename,
                        readyAt: d.now(),
                        signal: fence.signal,
                    });
                } catch {
                    // COMMIT rejection may mean confirmation was lost, rather than rollback.
                    let observed;
                    try {
                        observed = await d.results.getByPage(attempt.pageId);
                    } catch {
                        retainPromoted = true;
                        throw new Error('localTranslation.storageUnavailable');
                    }
                    if (
                        observed?.sourceKind !== 'REMOTE' ||
                        observed.attemptId !== attempt.id ||
                        observed.renderedFilename !== stage.renderedFilename ||
                        observed.sha256 !== manifest.image.sha256
                    )
                        throw new Error('localTranslation.storageUnavailable');
                    committed = true;
                }
                const result = await d.results.getByPage(attempt.pageId);
                if (
                    !result ||
                    result.sourceKind !== 'REMOTE' ||
                    result.attemptId !== attempt.id ||
                    result.sha256 !== manifest.image.sha256 ||
                    !(await d.validateStored(project.id, result.renderedFilename, result.sha256))
                )
                    throw new Error('localTranslation.storageUnavailable');
                active();
                return { ...state, status: 'ready', stage: 1, empty: manifest.regions.length === 0 };
            } catch (error) {
                if (!committed && !retainPromoted && state.pageId) {
                    try {
                        await d.attempts.failVolatileAttempt(attemptId, d.now(), 'submission-unknown');
                    } catch {
                        retainPromoted = !!stage;
                    }
                }
                const cancelled = signal?.aborted || delivery?.signal.aborted || fence.signal.aborted;
                const message = error instanceof Error ? error.message : '';
                return {
                    ...state,
                    status: cancelled ? 'cancelled' : retainPromoted || committed ? 'waiting' : 'failed',
                    error: ['localTranslation.invalidRemoteManifest', 'localTranslation.deliveryLost', 'localTranslation.storageUnavailable'].includes(message)
                        ? message
                        : 'localTranslation.storageUnavailable',
                };
            } finally {
                try {
                    if (stage) {
                        if (!committed && !retainPromoted) await stage.discard();
                        else await stage.finish();
                    }
                } catch {
                    /* Startup reconciliation owns confirmed orphan files; never log content. */
                } finally {
                    signal?.removeEventListener('abort', abandon);
                    delivery?.signal.removeEventListener('abort', abandon);
                    delivery?.dispose();
                }
            }
        });
    const run: AcquireRemoteTranslationResultController['run'] = (id, signal, onProgress) => {
        const current = pending.get(id);
        if (current)
            return current.then(result => {
                if (signal?.aborted) return { ...result, status: 'cancelled' as const };
                // A new foreground owner resolves local truth after the abandoned owner cleans up.
                // It cannot borrow that owner's cancellation or take its buffers while still in use.
                return result.status === 'cancelled' ? run(id, signal, onProgress) : result;
            });
        const operation = execute(id, signal, onProgress).finally(() => pending.delete(id));
        pending.set(id, operation);
        return operation.then(result => (signal?.aborted ? { ...result, status: 'cancelled' as const } : result));
    };
    return {
        run,
        async claimOpen(pageId, signal) {
            if (signal?.aborted) return false;
            return d.writer.claimAutoOpen(pageId, d.now());
        },
    };
}
export const acquireRemoteTranslationResultController = createAcquireRemoteTranslationResultController({
    attempts: remoteProcessingAttemptRepository,
    projects: translationProjectRepository,
    results: localTranslationResultRepository,
    writer: remoteRenderedResultRepository,
    takeDelivery: takeVolatileDelivery,
    withFiles: withLocalTranslationResultFiles,
    hashBytes: sha256Bytes,
    originalHash: originalPageHash,
    stage: stageAcquisition,
    validateStored: validateAcquiredFile,
    now: Date.now,
});
