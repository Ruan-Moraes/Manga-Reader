import {
    pageJobEnvelopeSchema,
    type RemoteProcessingAttempt,
    type RemoteProcessingAttemptRepository,
    remoteProcessingAttemptRepository,
    type RemoteProcessingErrorCode,
} from '@/entities/remote-processing-attempt';
import {
    capabilitiesAreUsable,
    capabilityAcceptsMedia,
    capabilitySupportsPair,
    getRemoteProcessingCapabilities,
    type RemoteProcessingCapabilities,
} from '@/entities/remote-processing-capability';
import { type RemoteProcessingIdentity, remoteProcessingIdentity } from '@/entities/remote-processing-identity';
import {
    TRANSLATION_PROJECT_NAMESPACE,
    type TranslationProject,
    type TranslationProjectRepository,
    translationProjectRepository,
} from '@/entities/translation-project';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/shared/files';
import { type SupportedLanguage } from '@/shared/i18n';
import { randomUuid } from '@/shared/lib';
import { createRemoteGatewayTransport, type RemoteGatewayTransport, RemoteGatewayTransportError } from '@/shared/remote-gateway';

import { nextPageToSend, nextQuotaRenewal } from './remoteQueue';

type TranslationPage = TranslationProject['pages'][number];

/** One page of the project and its latest attempt, in reading order. */
export interface RemotePageProgress {
    page: TranslationPage;
    attempt: RemoteProcessingAttempt | null;
}

export interface RemoteProcessingSnapshot {
    project: TranslationProject | null;
    capabilities: RemoteProcessingCapabilities | null;
    /** The attempt the panel follows: the newest one still running, else the newest one. */
    attempt: RemoteProcessingAttempt | null;
    error: RemoteProcessingErrorCode | null;
    pages: RemotePageProgress[];
    /** Until when the queue waits for the daily quota to renew, or null. */
    pausedUntil: number | null;
}

export interface StartRemoteProcessingController {
    initialize(signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
    acceptConsent(projectId: string, capabilities: RemoteProcessingCapabilities, locale: SupportedLanguage): Promise<void>;
    /** Sends the next page of the queue when the queue allows it; otherwise only returns the state. */
    submit(projectId: string, signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
    reconcile(signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
    /** Local state again, with the last capabilities and no network: after a follow-up round changed it. */
    refresh(): Promise<RemoteProcessingSnapshot>;
    /** Puts one failed page back in the queue and sends it when the queue allows. */
    retryPage(projectId: string, pageId: string, signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
}

interface Dependencies {
    projects: TranslationProjectRepository;
    attempts: RemoteProcessingAttemptRepository;
    identity: RemoteProcessingIdentity;
    files: PrivateBatchFiles;
    createTransport(): RemoteGatewayTransport;
    now(): number;
    uuid(): string;
}

const RUNNING_ATTEMPTS = ['CREATED', 'SUBMITTING', 'UNKNOWN', 'CANCEL_PENDING'];

function localError(error: unknown): RemoteProcessingErrorCode {
    if (error instanceof RemoteGatewayTransportError && (error.code === 'network' || error.code === 'timeout')) return 'network-required';
    if (error instanceof Error && error.message === 'network-required') return 'network-required';
    if (error instanceof Error && error.message === 'storage-unavailable') return 'storage-unavailable';
    return 'capabilities-unavailable';
}

async function loadCapabilities(dependencies: Dependencies, signal?: AbortSignal) {
    const transport = dependencies.createTransport();
    const capabilities = await getRemoteProcessingCapabilities(transport, signal);
    return { transport, capabilities };
}

function followed(pages: readonly RemotePageProgress[]): RemoteProcessingAttempt | null {
    const attempts = pages.flatMap(item => (item.attempt ? [item.attempt] : []));
    const running = attempts.filter(
        attempt => RUNNING_ATTEMPTS.includes(attempt.status) || (attempt.status === 'ACCEPTED' && attempt.resultAcknowledgedAt === null),
    );
    const pool = running.length > 0 ? running : attempts;
    return [...pool].sort((left, right) => right.updatedAt - left.updatedAt)[0] ?? null;
}

async function snapshot(
    dependencies: Dependencies,
    capabilities: RemoteProcessingCapabilities | null,
    error: RemoteProcessingErrorCode | null,
): Promise<RemoteProcessingSnapshot> {
    const project = await dependencies.projects.getLatest();
    if (!project) return { project, capabilities, attempt: null, error, pages: [], pausedUntil: null };
    const latest = await dependencies.attempts.listLatestByProject(project.id);
    const pages = [...project.pages]
        .sort((left, right) => left.position - right.position)
        .map(page => ({ page, attempt: latest.find(attempt => attempt.pageId === page.id) ?? null }));
    const pausedUntil = await dependencies.projects.getRemoteQueuePause(project.id);
    return {
        project,
        capabilities,
        attempt: followed(pages),
        error,
        pages,
        pausedUntil: pausedUntil !== null && pausedUntil > dependencies.now() ? pausedUntil : null,
    };
}

function validatePage(project: TranslationProject | null, page: TranslationPage | undefined, capabilities: RemoteProcessingCapabilities, now: number) {
    if (!project || !['DRAFT', 'QUEUED', 'PROCESSING'].includes(project.status) || project.languageReviewRequired || !page || page.status !== 'DRAFT') {
        throw new Error('capabilities-unavailable');
    }
    if (!capabilitiesAreUsable(capabilities, now)) throw new Error('capabilities-unavailable');
    if (!capabilitySupportsPair(capabilities, project.sourceLanguage, project.targetLanguage)) throw new Error('unsupported-pair');
    if (
        !capabilityAcceptsMedia(capabilities, {
            mimeType: page.originalMimeType,
            byteSize: page.originalByteSize,
            widthPx: page.widthPx,
            heightPx: page.heightPx,
        })
    ) {
        throw new Error('capabilities-unavailable');
    }
    return { project, page };
}

function mappedValidationError(error: unknown): RemoteProcessingErrorCode {
    if (error instanceof Error && error.message === 'unsupported-pair') return 'unsupported-pair';
    return localError(error);
}

function quotaExceeded(status: number, body: unknown): boolean {
    return status === 429 && typeof body === 'object' && body !== null && (body as { code?: unknown }).code === 'quota-exceeded';
}

async function applyEnvelope(
    dependencies: Dependencies,
    attempt: RemoteProcessingAttempt,
    projectId: string,
    body: unknown,
    now: number,
): Promise<RemoteProcessingAttempt> {
    const envelope = pageJobEnvelopeSchema.safeParse(body);
    if (!envelope.success || envelope.data.contractVersion !== attempt.gatewayContractVersion || envelope.data.status !== 'QUEUED') {
        return dependencies.attempts.markUnknown(attempt.id, now);
    }
    return dependencies.attempts.acceptAndQueue(attempt.id, projectId, attempt.pageId, envelope.data.jobRef, envelope.data.status, now);
}

/** The multipart fields of one page; the chapter reference is the project's, the same on every page. */
function fields(project: TranslationProject, page: TranslationPage, capabilities: RemoteProcessingCapabilities, attemptRef: string, contextRef: string) {
    return {
        mimeType: page.originalMimeType,
        byteSize: String(page.originalByteSize),
        widthPx: String(page.widthPx),
        heightPx: String(page.heightPx),
        sourceLanguage: project.sourceLanguage,
        targetLanguage: project.targetLanguage,
        disclosureVersion: capabilities.disclosure.version,
        attemptRef,
        contextRef,
    };
}

export function createStartRemoteProcessingController(dependencies: Dependencies): StartRemoteProcessingController {
    let submission: Promise<RemoteProcessingSnapshot> | null = null;
    let known: RemoteProcessingCapabilities | null = null;
    const remember = (result: RemoteProcessingSnapshot) => {
        if (result.capabilities) known = result.capabilities;
        return result;
    };
    const reconciliations = new Map<AbortSignal | undefined, Promise<RemoteProcessingSnapshot>>();

    const initialize = async (signal?: AbortSignal): Promise<RemoteProcessingSnapshot> => {
        try {
            await Promise.all([dependencies.projects.initialize(), dependencies.attempts.initialize()]);
            const { capabilities } = await loadCapabilities(dependencies, signal);
            return remember(
                await snapshot(dependencies, capabilities, capabilitiesAreUsable(capabilities, dependencies.now()) ? null : 'capabilities-unavailable'),
            );
        } catch (error) {
            return snapshot(dependencies, null, localError(error));
        }
    };

    const submit = (projectId: string, signal?: AbortSignal): Promise<RemoteProcessingSnapshot> => {
        if (submission) return submission;
        submission = (async () => {
            let capabilities: RemoteProcessingCapabilities | null = null;
            let attempt: RemoteProcessingAttempt | null = null;
            try {
                const loaded = await loadCapabilities(dependencies, signal);
                capabilities = remember({
                    project: null,
                    capabilities: loaded.capabilities,
                    attempt: null,
                    error: null,
                    pages: [],
                    pausedUntil: null,
                }).capabilities!;
                const project = await dependencies.projects.getById(projectId);
                if (!project) throw new Error('capabilities-unavailable');
                const decision = nextPageToSend(
                    project,
                    await dependencies.attempts.listLatestByProject(projectId),
                    dependencies.now(),
                    await dependencies.projects.getRemoteQueuePause(projectId),
                );
                if (!decision.page) return snapshot(dependencies, capabilities, null);
                const validated = validatePage(project, decision.page, capabilities, dependencies.now());
                const consent = await dependencies.attempts.getConsent(projectId, capabilities.disclosure.version);
                if (!consent) return snapshot(dependencies, capabilities, 'consent-required');
                const exists = await dependencies.files.fileExists(TRANSLATION_PROJECT_NAMESPACE, projectId, validated.page.originalFilename);
                if (!exists) return snapshot(dependencies, capabilities, 'storage-unavailable');
                const contextRef = await dependencies.projects.ensureContextRef(projectId, dependencies.uuid());
                attempt = await dependencies.attempts.createOrGetActive({
                    id: dependencies.uuid(),
                    pageId: validated.page.id,
                    idempotencyKey: dependencies.uuid(),
                    gatewayKey: capabilities.gatewayKey,
                    gatewayContractVersion: capabilities.contractVersion,
                    createdAt: dependencies.now(),
                });
                if (attempt.status === 'ACCEPTED' || attempt.status === 'CANCEL_PENDING') {
                    return snapshot(dependencies, capabilities, null);
                }
                const session = await dependencies.identity.getSession(capabilities.gatewayKey, loaded.transport, signal);
                attempt = await dependencies.attempts.markSubmitting(attempt.id, dependencies.now());
                const response = await loaded.transport.upload(
                    '/v1/page-jobs',
                    fields(validated.project, validated.page, capabilities, attempt.id, contextRef),
                    {
                        uri: dependencies.files.fileUri(TRANSLATION_PROJECT_NAMESPACE, projectId, validated.page.originalFilename),
                        mimeType: validated.page.originalMimeType,
                    },
                    { token: session.accessToken, headers: { 'Idempotency-Key': attempt.idempotencyKey }, signal },
                );
                if (quotaExceeded(response.status, response.body)) {
                    // The page stays DRAFT and goes again once the daily quota renews; nothing was reserved.
                    await dependencies.attempts.markRejected(attempt.id, dependencies.now(), 'gateway-rejected');
                    await dependencies.projects.setRemoteQueuePause(projectId, nextQuotaRenewal(dependencies.now()));
                    return snapshot(dependencies, capabilities, 'quota-exceeded');
                }
                if (response.status !== 202) {
                    await dependencies.attempts.markRejected(attempt.id, dependencies.now(), 'gateway-rejected');
                    return snapshot(dependencies, capabilities, 'gateway-rejected');
                }
                const accepted = await applyEnvelope(dependencies, attempt, projectId, response.body, dependencies.now());
                await dependencies.projects.setRemoteQueuePause(projectId, null);
                return snapshot(dependencies, capabilities, accepted.status === 'UNKNOWN' ? 'submission-unknown' : null);
            } catch (error) {
                if (attempt?.status === 'SUBMITTING') {
                    await dependencies.attempts.markUnknown(attempt.id, dependencies.now()).catch(() => undefined);
                    return snapshot(dependencies, capabilities, 'submission-unknown');
                }
                return snapshot(dependencies, capabilities, mappedValidationError(error));
            }
        })().finally(() => {
            submission = null;
        });
        return submission;
    };

    return {
        initialize,
        refresh() {
            return snapshot(dependencies, known, null);
        },
        async acceptConsent(projectId, capabilities, locale) {
            const project = await dependencies.projects.getById(projectId);
            const first = project ? [...project.pages].sort((left, right) => left.position - right.position).find(page => page.status === 'DRAFT') : undefined;
            validatePage(project, first, capabilities, dependencies.now());
            await dependencies.attempts.saveConsent({
                projectId,
                disclosureVersion: capabilities.disclosure.version,
                presentedLocale: locale,
                acceptedAt: dependencies.now(),
            });
        },
        submit,
        async retryPage(projectId, pageId, signal) {
            await dependencies.attempts.reopenFailedPage(pageId, dependencies.now());
            return submit(projectId, signal);
        },
        reconcile(signal) {
            // Compartilhar somente o mesmo dono do cancelamento, sem cache após conclusão.
            const pending = reconciliations.get(signal);
            if (pending) return pending;
            const operation = (async () => {
                let capabilities: RemoteProcessingCapabilities | null = null;
                try {
                    const loaded = await loadCapabilities(dependencies, signal);
                    capabilities = loaded.capabilities;
                    known = capabilities;
                    const session = await dependencies.identity.getSession(capabilities.gatewayKey, loaded.transport, signal);
                    const recoverable = await dependencies.attempts.listRecoverable();
                    for (const attempt of recoverable.filter(
                        item => item.gatewayKey === capabilities!.gatewayKey && item.gatewayContractVersion === capabilities!.contractVersion,
                    )) {
                        const path = attempt.remoteJobRef
                            ? `/v1/page-jobs/${encodeURIComponent(attempt.remoteJobRef)}`
                            : `/v1/page-jobs/by-idempotency/${encodeURIComponent(attempt.idempotencyKey)}`;
                        const response = await loaded.transport.request(path, { token: session.accessToken, signal });
                        if (response.status === 404 && !attempt.remoteJobRef) {
                            // The replay sends the attempt's own page with the same key and chapter reference.
                            const projectId = await dependencies.attempts.getProjectIdForPage(attempt.pageId);
                            const project = projectId ? await dependencies.projects.getById(projectId) : null;
                            const validated = validatePage(
                                project,
                                project?.pages.find(page => page.id === attempt.pageId),
                                capabilities,
                                dependencies.now(),
                            );
                            const consent = await dependencies.attempts.getConsent(projectId!, capabilities.disclosure.version);
                            const exists = await dependencies.files.fileExists(TRANSLATION_PROJECT_NAMESPACE, projectId!, validated.page.originalFilename);
                            if (!consent || !exists) continue;
                            const contextRef = await dependencies.projects.ensureContextRef(projectId!, dependencies.uuid());
                            const submitting = await dependencies.attempts.markSubmitting(attempt.id, dependencies.now());
                            const replay = await loaded.transport.upload(
                                '/v1/page-jobs',
                                fields(validated.project, validated.page, capabilities, submitting.id, contextRef),
                                {
                                    uri: dependencies.files.fileUri(TRANSLATION_PROJECT_NAMESPACE, projectId!, validated.page.originalFilename),
                                    mimeType: validated.page.originalMimeType,
                                },
                                { token: session.accessToken, headers: { 'Idempotency-Key': submitting.idempotencyKey }, signal },
                            );
                            if (replay.status === 202) {
                                await applyEnvelope(dependencies, submitting, projectId!, replay.body, dependencies.now());
                            } else {
                                await dependencies.attempts.markRejected(submitting.id, dependencies.now(), 'gateway-rejected');
                                if (quotaExceeded(replay.status, replay.body)) {
                                    await dependencies.projects.setRemoteQueuePause(projectId!, nextQuotaRenewal(dependencies.now()));
                                }
                            }
                            continue;
                        }
                        const envelope = pageJobEnvelopeSchema.safeParse(response.body);
                        if (
                            response.status !== 200 ||
                            !envelope.success ||
                            envelope.data.contractVersion !== attempt.gatewayContractVersion ||
                            (attempt.remoteJobRef !== null && envelope.data.jobRef !== attempt.remoteJobRef)
                        ) {
                            continue;
                        }
                        const projectId = await dependencies.attempts.getProjectIdForPage(attempt.pageId);
                        if (!projectId) continue;
                        if (envelope.data.status === 'CANCELLED') {
                            await dependencies.attempts.confirmCancelled(attempt.id, projectId, attempt.pageId, dependencies.now());
                        } else if (!attempt.remoteJobRef) {
                            await dependencies.attempts.acceptAndQueue(
                                attempt.id,
                                projectId,
                                attempt.pageId,
                                envelope.data.jobRef,
                                envelope.data.status,
                                dependencies.now(),
                            );
                        } else {
                            await dependencies.attempts.observe(attempt.id, envelope.data.status, dependencies.now());
                        }
                    }
                    return snapshot(dependencies, capabilities, null);
                } catch {
                    return snapshot(dependencies, capabilities, 'submission-unknown');
                }
            })().finally(() => {
                reconciliations.delete(signal);
            });
            reconciliations.set(signal, operation);
            return operation;
        },
    };
}

export const startRemoteProcessingController = createStartRemoteProcessingController({
    projects: translationProjectRepository,
    attempts: remoteProcessingAttemptRepository,
    identity: remoteProcessingIdentity,
    files: appPrivateBatchFiles,
    createTransport: () => createRemoteGatewayTransport(),
    now: Date.now,
    uuid: randomUuid,
});
