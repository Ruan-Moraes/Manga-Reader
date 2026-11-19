import {
    type LocalTranslationResultRepository,
    localTranslationResultRepository,
    parseRemoteRenderManifestBytes,
    TRANSLATION_RESULT_NAMESPACE,
} from '@/entities/local-translation-result';
import {
    type PageJobEnvelope,
    pageJobEnvelopeSchema,
    type RemoteJobStatus,
    type RemoteProcessingAttempt,
    type RemoteProcessingAttemptRepository,
    remoteProcessingAttemptRepository,
} from '@/entities/remote-processing-attempt';
import { getRemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import { type RemoteProcessingIdentity, remoteProcessingIdentity } from '@/entities/remote-processing-identity';
import { type TranslationProjectRepository, translationProjectRepository } from '@/entities/translation-project';
import { appPrivateBatchFiles, appTemporaryFiles, type PrivateBatchFiles, sha256File, type TemporaryFiles } from '@/shared/files';
import { createRemoteGatewayTransport, type RemoteGatewayTransport } from '@/shared/remote-gateway';

/** Why a follow-up round ended without everything settled; nothing here is stored. */
export type AcquireRemoteResultError = 'network-required' | 'result-unavailable';

export interface AcquireRemoteResultSnapshot {
    /** Attempts still followed after this round: the caller keeps polling while there are any. */
    active: number;
    /** Highest stage confirmed in this round, to restart the backoff when it moves. */
    stages: readonly RemoteJobStatus[];
    /** A project whose first result was just persisted and marked opened: navigate to it once. */
    openProjectId: string | null;
    error: AcquireRemoteResultError | null;
}

export interface AcquireRemoteResultController {
    sync(signal?: AbortSignal): Promise<AcquireRemoteResultSnapshot>;
}

interface Dependencies {
    projects: Pick<TranslationProjectRepository, 'getById'>;
    attempts: Pick<
        RemoteProcessingAttemptRepository,
        'initialize' | 'listActive' | 'getProjectIdForPage' | 'advance' | 'markRemoteFailed' | 'markAcknowledged' | 'confirmCancelled'
    >;
    results: Pick<LocalTranslationResultRepository, 'getByPage' | 'listByProject' | 'saveRemoteResult' | 'markAutoOpened'>;
    identity: RemoteProcessingIdentity;
    files: Pick<PrivateBatchFiles, 'stageBatch' | 'promoteStagedFiles' | 'discardStaging' | 'removeFile'>;
    temporary: TemporaryFiles;
    hashFile(uri: string): Promise<string>;
    createTransport(): RemoteGatewayTransport;
    loadCapabilities: typeof getRemoteProcessingCapabilities;
    now(): number;
}

const MAX_IMAGE_BYTES = 64 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
const IDLE: AcquireRemoteResultSnapshot = { active: 0, stages: [], openProjectId: null, error: null };

class ResultUnavailable extends Error {
    constructor() {
        super('result-unavailable');
    }
}

function safeSegment(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function createAcquireRemoteResultController(dependencies: Dependencies): AcquireRemoteResultController {
    let running: Promise<AcquireRemoteResultSnapshot> | null = null;

    /** Downloads, verifies and commits one READY page; the page is READY only after the commit. */
    async function acquire(attempt: RemoteProcessingAttempt, projectId: string, envelope: PageJobEnvelope, signal?: AbortSignal) {
        const result = envelope.result;
        const project = await dependencies.projects.getById(projectId);
        if (!result || !project || !attempt.remoteJobRef) throw new ResultUnavailable();
        const name = safeSegment(`${attempt.id}`);
        const image = await dependencies.temporary.download(result.image.url, `${name}-image`, MAX_IMAGE_BYTES, signal);
        const stagingId = `${name}-remote`;
        const filename = safeSegment(`remote-${attempt.pageId}-${attempt.id}`);
        let promoted = false;
        try {
            if (image.byteSize !== result.image.byteSize || (await dependencies.hashFile(image.uri)) !== result.image.sha256) throw new ResultUnavailable();
            const manifestFile = await dependencies.temporary.download(result.manifest.url, `${name}-manifest`, MAX_MANIFEST_BYTES, signal);
            let manifest;
            try {
                if (manifestFile.byteSize !== result.manifest.byteSize) throw new ResultUnavailable();
                manifest = await parseRemoteRenderManifestBytes(await dependencies.temporary.readBytes(manifestFile.uri), result.manifest.sha256, {
                    jobRef: attempt.remoteJobRef,
                    sourceLanguage: project.sourceLanguage,
                    targetLanguage: project.targetLanguage,
                    image: { sha256: result.image.sha256, byteSize: result.image.byteSize, widthPx: result.widthPx, heightPx: result.heightPx },
                });
            } finally {
                await dependencies.temporary.remove(manifestFile.uri);
            }
            // Verified bytes move into the private directory before the commit that makes the page READY.
            await dependencies.files.stageBatch(TRANSLATION_RESULT_NAMESPACE, stagingId, [{ sourceUri: image.uri, filename }]);
            await dependencies.files.promoteStagedFiles(TRANSLATION_RESULT_NAMESPACE, stagingId, projectId, [filename]);
            promoted = true;
            await dependencies.results.saveRemoteResult({
                projectId,
                pageId: attempt.pageId,
                attemptId: attempt.id,
                renderedFilename: filename,
                byteSize: result.image.byteSize,
                widthPx: result.widthPx,
                heightPx: result.heightPx,
                sha256: result.image.sha256,
                readyAt: dependencies.now(),
                manifest,
            });
        } catch (error) {
            await dependencies.files.discardStaging(TRANSLATION_RESULT_NAMESPACE, stagingId);
            if (promoted) await dependencies.files.removeFile(TRANSLATION_RESULT_NAMESPACE, projectId, filename);
            if (error instanceof ResultUnavailable) throw error;
            throw new ResultUnavailable();
        } finally {
            await dependencies.temporary.remove(image.uri);
        }
    }

    /** The ACK only follows a persisted result; a failed ACK leaves the result and is retried next round. */
    async function acknowledge(attempt: RemoteProcessingAttempt, transport: RemoteGatewayTransport, token: string, signal?: AbortSignal) {
        const response = await transport.request(`/v1/page-jobs/${encodeURIComponent(attempt.remoteJobRef!)}/ack`, { method: 'POST', token, signal });
        if (response.status === 202 || response.status === 404) await dependencies.attempts.markAcknowledged(attempt.id, dependencies.now());
    }

    /** Opens a project once: only when none of its results was opened before; the mark is stored before navigating. */
    async function claimOpening(projectId: string): Promise<boolean> {
        const results = await dependencies.results.listByProject(projectId);
        const fresh = results.filter(result => result.sourceKind === 'REMOTE' && result.autoOpenedAt === null);
        if (fresh.length === 0) return false;
        const openedBefore = results.some(result => result.autoOpenedAt !== null);
        for (const result of fresh) await dependencies.results.markAutoOpened(result.pageId, Math.max(dependencies.now(), result.readyAt));
        return !openedBefore;
    }

    async function round(signal?: AbortSignal): Promise<AcquireRemoteResultSnapshot> {
        await dependencies.attempts.initialize();
        const attempts = await dependencies.attempts.listActive();
        if (attempts.length === 0) return IDLE;
        const transport = dependencies.createTransport();
        const capabilities = await dependencies.loadCapabilities(transport, signal);
        const session = await dependencies.identity.getSession(capabilities.gatewayKey, transport, signal);
        const stages: RemoteJobStatus[] = [];
        let openProjectId: string | null = null;
        let error: AcquireRemoteResultError | null = null;
        for (const attempt of attempts) {
            if (attempt.gatewayKey !== capabilities.gatewayKey || attempt.gatewayContractVersion !== capabilities.contractVersion) continue;
            const projectId = await dependencies.attempts.getProjectIdForPage(attempt.pageId);
            if (!projectId) continue;
            const persisted = (await dependencies.results.getByPage(attempt.pageId))?.attemptId === attempt.id;
            const response = await transport.request(`/v1/page-jobs/${encodeURIComponent(attempt.remoteJobRef!)}`, { token: session.accessToken, signal });
            if (response.status === 404) {
                // The job is gone: a persisted result owes nothing more; otherwise the result is lost.
                if (persisted) await dependencies.attempts.markAcknowledged(attempt.id, dependencies.now());
                else await dependencies.attempts.markRemoteFailed(attempt.id, 'RESULT_EXPIRED', dependencies.now());
                continue;
            }
            const envelope = pageJobEnvelopeSchema.safeParse(response.body);
            if (
                response.status !== 200 ||
                !envelope.success ||
                envelope.data.jobRef !== attempt.remoteJobRef ||
                envelope.data.contractVersion !== attempt.gatewayContractVersion
            ) {
                error = 'result-unavailable';
                continue;
            }
            const status = envelope.data.status;
            stages.push(status);
            if (status === 'CANCELLED') {
                await dependencies.attempts.confirmCancelled(attempt.id, projectId, attempt.pageId, dependencies.now());
            } else if (status === 'FAILED' || status === 'RESULT_EXPIRED') {
                if (persisted) await dependencies.attempts.markAcknowledged(attempt.id, dependencies.now());
                else await dependencies.attempts.markRemoteFailed(attempt.id, status, dependencies.now());
            } else if (status === 'READY') {
                await dependencies.attempts.advance(attempt.id, 'READY', dependencies.now());
                try {
                    if (!persisted) await acquire(attempt, projectId, envelope.data, signal);
                    if (openProjectId === null && (await claimOpening(projectId))) openProjectId = projectId;
                    await acknowledge(attempt, transport, session.accessToken, signal);
                } catch (failure) {
                    if (!(failure instanceof ResultUnavailable)) throw failure;
                    error = 'result-unavailable';
                }
            } else {
                await dependencies.attempts.advance(attempt.id, status, dependencies.now());
            }
        }
        return { active: (await dependencies.attempts.listActive()).length, stages, openProjectId, error };
    }

    return {
        sync(signal) {
            // One round at a time: a timer and a return to the foreground never download the same page twice.
            running ??= round(signal)
                .catch((): AcquireRemoteResultSnapshot => ({ ...IDLE, active: 1, error: 'network-required' }))
                .finally(() => {
                    running = null;
                });
            return running;
        },
    };
}

export const acquireRemoteResultController = createAcquireRemoteResultController({
    projects: translationProjectRepository,
    attempts: remoteProcessingAttemptRepository,
    results: localTranslationResultRepository,
    identity: remoteProcessingIdentity,
    files: appPrivateBatchFiles,
    temporary: appTemporaryFiles,
    hashFile: sha256File,
    createTransport: () => createRemoteGatewayTransport(),
    loadCapabilities: getRemoteProcessingCapabilities,
    now: Date.now,
});
