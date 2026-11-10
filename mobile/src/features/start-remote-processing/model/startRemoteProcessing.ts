import { File } from 'expo-file-system';
import { z } from 'zod';

import {
    createVolatileIdempotencyKey,
    interruptVolatileDelivery,
    putVolatileDelivery,
    type RemoteProcessingAttempt,
    type RemoteProcessingAttemptRepository,
    remoteProcessingAttemptRepository,
    type RemoteProcessingErrorCode,
    reserveVolatileDelivery,
    volatileReceiptSchema,
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
import { appPrivateBatchFiles, type PrivateBatchFiles, sha256Bytes } from '@/shared/files';
import { type SupportedLanguage } from '@/shared/i18n';
import { randomUuid } from '@/shared/lib';
import { MEDIA_VALIDATION_POLICY_VERSION, parseImageStructure } from '@/shared/media-inspection';
import { createRemoteGatewayTransport, createVolatileTranslationTransport, type RemoteGatewayTransport } from '@/shared/remote-gateway';

export interface RemoteProcessingSnapshot {
    project: TranslationProject | null;
    capabilities: RemoteProcessingCapabilities | null;
    attempt: RemoteProcessingAttempt | null;
    error: RemoteProcessingErrorCode | null;
}
export interface StartRemoteProcessingController {
    initialize(signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
    acceptConsent(projectId: string, capabilities: RemoteProcessingCapabilities, locale: SupportedLanguage, pageId?: string): Promise<void>;
    submit(projectId: string, signal?: AbortSignal, pageId?: string): Promise<RemoteProcessingSnapshot>;
    reconcile(signal?: AbortSignal): Promise<RemoteProcessingSnapshot>;
    interrupt(attemptId: string): Promise<RemoteProcessingSnapshot>;
}
interface Dependencies {
    projects: TranslationProjectRepository;
    attempts: RemoteProcessingAttemptRepository;
    identity: RemoteProcessingIdentity;
    files: PrivateBatchFiles;
    createTransport(): RemoteGatewayTransport;
    createVolatileTransport?(): ReturnType<typeof createVolatileTranslationTransport>;
    readBytes?(uri: string): Promise<Uint8Array<ArrayBuffer>>;
    hashBytes?: typeof sha256Bytes;
    now(): number;
    uuid(): string;
}
async function snapshot(d: Dependencies, capabilities: RemoteProcessingCapabilities | null, error: RemoteProcessingErrorCode | null, projectId?: string, pageId?: string) {
    const project = projectId ? await d.projects.getById(projectId) : await d.projects.getLatest();
    const page = project ? (pageId ? project.pages.find(candidate => candidate.id === pageId) : [...project.pages].sort((a, b) => a.position - b.position)[0]) : undefined;
    return { project, capabilities, attempt: page ? await d.attempts.getLatestByPage(page.id) : null, error };
}
function validateProject(project: TranslationProject | null, capabilities: RemoteProcessingCapabilities, now: number, pageId?: string) {
    const page = project ? (pageId ? project.pages.find(candidate => candidate.id === pageId) : [...project.pages].sort((a, b) => a.position - b.position)[0]) : undefined;
    if (
        !project ||
        !(project.status === 'DRAFT' || project.status === 'FAILED' || (['QUEUED', 'PROCESSING'].includes(project.status) && (page?.status === 'FAILED' || (!!pageId && page?.status === 'DRAFT')))) ||
        project.languageReviewRequired ||
        !page ||
        !['DRAFT', 'FAILED'].includes(page.status) ||
        page.mediaValidationPolicyVersion !== MEDIA_VALIDATION_POLICY_VERSION ||
        !Number.isFinite(page.mediaValidatedAt) ||
        page.mediaValidatedAt <= 0
    )
        throw new Error('capabilities-unavailable');
    if (!capabilitiesAreUsable(capabilities, now)) throw new Error('capabilities-unavailable');
    if (!capabilitySupportsPair(capabilities, project.sourceLanguage, project.targetLanguage)) throw new Error('unsupported-pair');
    if (
        !capabilityAcceptsMedia(capabilities, {
            mimeType: page.originalMimeType,
            byteSize: page.originalByteSize,
            widthPx: page.widthPx,
            heightPx: page.heightPx,
        })
    )
        throw new Error('capabilities-unavailable');
    return { project, page };
}
const deliveryHeader = z
    .object({ jobRef: z.uuid(), originalSha256: z.string().regex(/^[0-9a-f]{64}$/), sourceLanguage: z.string(), targetLanguage: z.string() })
    .passthrough();

export function createStartRemoteProcessingController(d: Dependencies): StartRemoteProcessingController {
    let submission: { projectId: string; pageId: string | undefined; signal: AbortSignal | undefined; promise: Promise<RemoteProcessingSnapshot> } | null = null;
    const reconciliations = new Map<AbortSignal | undefined, Promise<RemoteProcessingSnapshot>>();
    const load = async (signal?: AbortSignal) => {
        const transport = d.createTransport();
        return { transport, capabilities: await getRemoteProcessingCapabilities(transport, signal) };
    };
    return {
        async initialize(signal) {
            try {
                await Promise.all([d.projects.initialize(), d.attempts.initialize()]);
                const { capabilities } = await load(signal);
                return snapshot(d, capabilities, capabilitiesAreUsable(capabilities, d.now()) ? null : 'capabilities-unavailable');
            } catch {
                return snapshot(d, null, 'capabilities-unavailable');
            }
        },
        async acceptConsent(projectId, capabilities, locale, pageId) {
            validateProject(await d.projects.getById(projectId), capabilities, d.now(), pageId);
            await d.attempts.saveConsent({ projectId, disclosureVersion: capabilities.disclosure.version, presentedLocale: locale, acceptedAt: d.now() });
        },
        submit(projectId, signal, pageId) {
            if (submission)
                return submission.projectId === projectId && submission.pageId === pageId && submission.signal === signal
                    ? submission.promise : snapshot(d, null, 'capabilities-unavailable', projectId, pageId);
            const targetSnapshot = (capabilities: RemoteProcessingCapabilities | null, error: RemoteProcessingErrorCode | null) =>
                snapshot(d, capabilities, error, projectId, pageId);
            const promise = (async () => {
                let capabilities: RemoteProcessingCapabilities | null = null;
                let attempt: RemoteProcessingAttempt | null = null;
                let original: Uint8Array<ArrayBuffer> | undefined;
                let reserved = false;
                let handedOff = false;
                let deposited = false;
                const abort = new AbortController();
                const cancel = () => abort.abort();
                signal?.addEventListener('abort', cancel, { once: true });
                try {
                    if (signal?.aborted) throw new Error();
                    const loaded = await load(abort.signal);
                    capabilities = loaded.capabilities;
                    const { project, page } = validateProject(await d.projects.getById(projectId), capabilities, d.now(), pageId);
                    if (!(await d.attempts.getConsent(projectId, capabilities.disclosure.version))) return targetSnapshot(capabilities, 'consent-required');
                    if (!(await d.files.fileExists(TRANSLATION_PROJECT_NAMESPACE, projectId, page.originalFilename)))
                        return targetSnapshot(capabilities, 'storage-unavailable');
                    attempt = await d.attempts.createOrGetActive({
                        id: d.uuid(),
                        pageId: page.id,
                        idempotencyKey: createVolatileIdempotencyKey(capabilities.generatedAt, d.uuid()),
                        gatewayKey: capabilities.gatewayKey,
                        gatewayContractVersion: capabilities.contractVersion,
                        createdAt: d.now(),
                    });
                    if (attempt.gatewayKey !== capabilities.gatewayKey || attempt.gatewayContractVersion !== '2.0')
                        return targetSnapshot(capabilities, 'capabilities-unavailable');
                    // No replay of a submitted, ambiguous, accepted or interrupted operation can send bytes.
                    if (attempt.status !== 'CREATED') return targetSnapshot(capabilities, 'submission-unknown');
                    reserveVolatileDelivery(attempt.id, cancel);
                    reserved = true;
                    const uri = d.files.fileUri(TRANSLATION_PROJECT_NAMESPACE, projectId, page.originalFilename);
                    original = await (d.readBytes ?? (value => new File(value).bytes()))(uri);
                    if (original.length !== page.originalByteSize || original.length > capabilities.mediaLimits.maxBytes)
                        throw new Error('storage-unavailable');
                    const inspected = parseImageStructure(
                        original.subarray(0, 262144),
                        original.subarray(Math.max(0, original.length - 4096)),
                        original.length,
                    );
                    if (
                        !inspected ||
                        inspected.animated ||
                        inspected.mimeType !== page.originalMimeType ||
                        inspected.width !== page.widthPx ||
                        inspected.height !== page.heightPx
                    )
                        throw new Error('storage-unavailable');
                    const sourceHash = await (d.hashBytes ?? sha256Bytes)(original);
                    if (abort.signal.aborted) throw new Error();
                    const session = await d.identity.getSession(capabilities.gatewayKey, loaded.transport, abort.signal);
                    const fresh = validateProject(await d.projects.getById(projectId), capabilities, d.now(), pageId);
                    if (
                        (!pageId && (await d.projects.getLatest())?.id !== projectId) ||
                        fresh.page.id !== page.id ||
                        fresh.page.originalFilename !== page.originalFilename ||
                        fresh.page.originalMimeType !== page.originalMimeType ||
                        fresh.page.mediaValidatedAt !== page.mediaValidatedAt ||
                        fresh.page.mediaValidationPolicyVersion !== page.mediaValidationPolicyVersion ||
                        fresh.page.originalByteSize !== original.length ||
                        fresh.page.widthPx !== page.widthPx ||
                        fresh.page.heightPx !== page.heightPx ||
                        fresh.project.sourceLanguage !== project.sourceLanguage ||
                        fresh.project.targetLanguage !== project.targetLanguage ||
                        !(await d.attempts.getConsent(projectId, capabilities.disclosure.version))
                    )
                        throw new Error('capabilities-unavailable');
                    attempt = await d.attempts.markSubmitting(attempt.id, d.now());
                    if (attempt.status !== 'SUBMITTING' || abort.signal.aborted) throw new Error('cancellation-unavailable');
                    const transport =
                        d.createVolatileTransport?.() ?? createVolatileTranslationTransport(process.env.EXPO_PUBLIC_TRANSLATION_GATEWAY_URL ?? '');
                    const bytes = await transport.process(
                        {
                            token: session.accessToken,
                            idempotencyKey: attempt.idempotencyKey,
                            body: original,
                            mimeType: page.originalMimeType,
                            widthPx: page.widthPx,
                            heightPx: page.heightPx,
                            sourceLanguage: project.sourceLanguage,
                            targetLanguage: project.targetLanguage,
                            disclosureVersion: capabilities.disclosure.version,
                        },
                        abort.signal,
                    );
                    try {
                        if (abort.signal.aborted) throw new Error();
                        const header = deliveryHeader.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.manifest)) as unknown);
                        if (
                            header.originalSha256 !== sourceHash ||
                            header.sourceLanguage !== project.sourceLanguage ||
                            header.targetLanguage !== project.targetLanguage
                        )
                            throw new Error();
                        putVolatileDelivery(attempt.id, header.jobRef, sourceHash, bytes);
                        deposited = true;
                        attempt = await d.attempts.acceptDirectResponse(attempt.id, project.id, page.id, header.jobRef, d.now());
                        if (abort.signal.aborted) {
                            await d.attempts.failVolatileAttempt(attempt.id, d.now(), 'cancellation-unavailable');
                            throw new Error();
                        }
                    } finally {
                        if (!deposited) bytes.dispose();
                    }
                    const delivered = await targetSnapshot(capabilities, null);
                    if (
                        abort.signal.aborted ||
                        delivered.project?.id !== projectId ||
                        delivered.project.status !== 'PROCESSING' ||
                        delivered.attempt?.id !== attempt.id ||
                        delivered.attempt.status !== 'ACCEPTED' ||
                        delivered.attempt.remoteJobRef !== attempt.remoteJobRef ||
                        delivered.project.pages.find(value => value.id === page.id)?.status !== 'PROCESSING'
                    ) {
                        await d.attempts.failVolatileAttempt(attempt.id, d.now(), 'cancellation-unavailable');
                        return targetSnapshot(capabilities, 'cancellation-unavailable');
                    }
                    handedOff = true;
                    return delivered;
                } catch (error) {
                    if (deposited && attempt) await d.attempts.failVolatileAttempt(attempt.id, d.now(), 'submission-unknown').catch(() => undefined);
                    if (attempt?.status === 'CREATED') await d.attempts.failVolatileAttempt(attempt.id, d.now(), 'storage-unavailable').catch(() => undefined);
                    if (attempt?.status === 'SUBMITTING') {
                        await d.attempts.markUnknown(attempt.id, d.now()).catch(() => undefined);
                        return targetSnapshot(capabilities, 'submission-unknown');
                    }
                    const code =
                        error instanceof Error && ['unsupported-pair', 'storage-unavailable'].includes(error.message)
                            ? (error.message as RemoteProcessingErrorCode)
                            : 'capabilities-unavailable';
                    return targetSnapshot(capabilities, code);
                } finally {
                    signal?.removeEventListener('abort', cancel);
                    original?.fill(0);
                    if (reserved && !handedOff && attempt) interruptVolatileDelivery(attempt.id);
                }
            })().finally(() => {
                submission = null;
            });
            submission = { projectId, pageId, signal, promise };
            return promise;
        },
        async interrupt(attemptId) {
            interruptVolatileDelivery(attemptId);
            await d.attempts.failVolatileAttempt(attemptId, d.now(), 'submission-unknown');
            return snapshot(d, null, 'submission-unknown');
        },
        reconcile(signal) {
            const current = reconciliations.get(signal);
            if (current) return current;
            const operation = (async () => {
                let capabilities: RemoteProcessingCapabilities | null = null;
                let queriedAttempt: RemoteProcessingAttempt | null = null;
                try {
                    const loaded = await load(signal);
                    capabilities = loaded.capabilities;
                    const session = await d.identity.getSession(capabilities.gatewayKey, loaded.transport, signal);
                    for (const attempt of await d.attempts.listRecoverable()) {
                        if (signal?.aborted) break;
                        if (attempt.gatewayKey !== capabilities.gatewayKey || attempt.gatewayContractVersion !== '2.0') continue;
                        queriedAttempt = attempt;
                        const response = await loaded.transport.request(`/v2/page-translations/by-idempotency/${encodeURIComponent(attempt.idempotencyKey)}`, {
                            token: session.accessToken,
                            signal,
                        });
                        if (signal?.aborted) break;
                        const parsed = volatileReceiptSchema.safeParse(response.body);
                        if (response.status === 404) {
                            await d.attempts.observeVolatileReceipt(attempt.id, null, d.now());
                            await d.attempts.failVolatileAttempt(attempt.id, d.now(), 'submission-unknown');
                        } else if (
                            response.status === 200 &&
                            parsed.success &&
                            (!attempt.remoteJobRef || attempt.remoteJobRef === parsed.data.receipt.operationRef)
                        ) {
                            await d.attempts.observeVolatileReceipt(attempt.id, parsed.data.receipt, d.now());
                        } else await d.attempts.observeVolatileReceipt(attempt.id, null, d.now());
                        queriedAttempt = null;
                    }
                    return snapshot(d, capabilities, null);
                } catch {
                    if (queriedAttempt && !signal?.aborted) await d.attempts.observeVolatileReceipt(queriedAttempt.id, null, d.now()).catch(() => undefined);
                    return snapshot(d, capabilities, 'submission-unknown');
                }
            })().finally(() => reconciliations.delete(signal));
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
