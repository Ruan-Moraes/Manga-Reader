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

export interface RemoteProcessingSnapshot {
    project: TranslationProject | null;
    capabilities: RemoteProcessingCapabilities | null;
    attempt: RemoteProcessingAttempt | null;
    error: RemoteProcessingErrorCode | null;
}

export interface StartRemoteProcessingController {
    initialize(signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
    acceptConsent(projectId: string, capabilities: RemoteProcessingCapabilities, locale: SupportedLanguage): Promise<void>;
    submit(projectId: string, signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
    reconcile(signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
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

async function snapshot(dependencies: Dependencies, capabilities: RemoteProcessingCapabilities | null, error: RemoteProcessingErrorCode | null) {
    const project = await dependencies.projects.getLatest();
    const firstPage = project ? [...project.pages].sort((left, right) => left.position - right.position)[0] : undefined;
    const attempt = firstPage ? await dependencies.attempts.getLatestByPage(firstPage.id) : null;
    return { project, capabilities, attempt, error };
}

function validateProject(project: TranslationProject | null, capabilities: RemoteProcessingCapabilities, now: number) {
    const page = project ? [...project.pages].sort((left, right) => left.position - right.position)[0] : undefined;
    if (!project || project.status !== 'DRAFT' || project.languageReviewRequired || !page || page.status !== 'DRAFT') {
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

export function createStartRemoteProcessingController(dependencies: Dependencies): StartRemoteProcessingController {
    let submission: Promise<RemoteProcessingSnapshot> | null = null;

    const initialize = async (signal?: AbortSignal): Promise<RemoteProcessingSnapshot> => {
        try {
            await Promise.all([dependencies.projects.initialize(), dependencies.attempts.initialize()]);
            const { capabilities } = await loadCapabilities(dependencies, signal);
            return snapshot(dependencies, capabilities, capabilitiesAreUsable(capabilities, dependencies.now()) ? null : 'capabilities-unavailable');
        } catch (error) {
            return snapshot(dependencies, null, localError(error));
        }
    };

    return {
        initialize,
        async acceptConsent(projectId, capabilities, locale) {
            const project = await dependencies.projects.getById(projectId);
            validateProject(project, capabilities, dependencies.now());
            await dependencies.attempts.saveConsent({
                projectId,
                disclosureVersion: capabilities.disclosure.version,
                presentedLocale: locale,
                acceptedAt: dependencies.now(),
            });
        },
        submit(projectId, signal) {
            if (submission) return submission;
            submission = (async () => {
                let capabilities: RemoteProcessingCapabilities | null = null;
                let attempt: RemoteProcessingAttempt | null = null;
                try {
                    const loaded = await loadCapabilities(dependencies, signal);
                    capabilities = loaded.capabilities;
                    const validated = validateProject(await dependencies.projects.getById(projectId), capabilities, dependencies.now());
                    const consent = await dependencies.attempts.getConsent(projectId, capabilities.disclosure.version);
                    if (!consent) return snapshot(dependencies, capabilities, 'consent-required');
                    const exists = await dependencies.files.fileExists(TRANSLATION_PROJECT_NAMESPACE, projectId, validated.page.originalFilename);
                    if (!exists) return snapshot(dependencies, capabilities, 'storage-unavailable');
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
                        {
                            mimeType: validated.page.originalMimeType,
                            byteSize: String(validated.page.originalByteSize),
                            widthPx: String(validated.page.widthPx),
                            heightPx: String(validated.page.heightPx),
                            sourceLanguage: validated.project.sourceLanguage,
                            targetLanguage: validated.project.targetLanguage,
                            disclosureVersion: capabilities.disclosure.version,
                            attemptRef: attempt.id,
                        },
                        {
                            uri: dependencies.files.fileUri(TRANSLATION_PROJECT_NAMESPACE, projectId, validated.page.originalFilename),
                            mimeType: validated.page.originalMimeType,
                        },
                        { token: session.accessToken, headers: { 'Idempotency-Key': attempt.idempotencyKey }, signal },
                    );
                    if (response.status !== 202) {
                        await dependencies.attempts.markRejected(attempt.id, dependencies.now(), 'gateway-rejected');
                        return snapshot(dependencies, capabilities, 'gateway-rejected');
                    }
                    const accepted = await applyEnvelope(dependencies, attempt, projectId, response.body, dependencies.now());
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
        },
        async reconcile(signal) {
            let capabilities: RemoteProcessingCapabilities | null = null;
            try {
                const loaded = await loadCapabilities(dependencies, signal);
                capabilities = loaded.capabilities;
                const session = await dependencies.identity.getSession(capabilities.gatewayKey, loaded.transport, signal);
                const recoverable = await dependencies.attempts.listRecoverable();
                for (const attempt of recoverable.filter(item => item.gatewayKey === capabilities!.gatewayKey)) {
                    const path = attempt.remoteJobRef
                        ? `/v1/page-jobs/${encodeURIComponent(attempt.remoteJobRef)}`
                        : `/v1/page-jobs/by-idempotency/${encodeURIComponent(attempt.idempotencyKey)}`;
                    const response = await loaded.transport.request(path, { token: session.accessToken, signal });
                    if (response.status === 404 && !attempt.remoteJobRef) {
                        const projectId = await dependencies.attempts.getProjectIdForPage(attempt.pageId);
                        const project = projectId ? await dependencies.projects.getById(projectId) : null;
                        const validated = validateProject(project, capabilities, dependencies.now());
                        const consent = await dependencies.attempts.getConsent(projectId!, capabilities.disclosure.version);
                        const exists = await dependencies.files.fileExists(TRANSLATION_PROJECT_NAMESPACE, projectId!, validated.page.originalFilename);
                        if (!consent || !exists) continue;
                        const submitting = await dependencies.attempts.markSubmitting(attempt.id, dependencies.now());
                        const replay = await loaded.transport.upload(
                            '/v1/page-jobs',
                            {
                                mimeType: validated.page.originalMimeType,
                                byteSize: String(validated.page.originalByteSize),
                                widthPx: String(validated.page.widthPx),
                                heightPx: String(validated.page.heightPx),
                                sourceLanguage: validated.project.sourceLanguage,
                                targetLanguage: validated.project.targetLanguage,
                                disclosureVersion: capabilities.disclosure.version,
                                attemptRef: submitting.id,
                            },
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
                        }
                        continue;
                    }
                    const envelope = pageJobEnvelopeSchema.safeParse(response.body);
                    if (response.status !== 200 || !envelope.success) continue;
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
