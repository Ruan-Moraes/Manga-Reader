import type { RemoteProcessingAttempt, RemoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import type { RemoteProcessingIdentity } from '@/entities/remote-processing-identity';
import type { TranslationProject, TranslationProjectRepository } from '@/entities/translation-project';
import type { PrivateBatchFiles } from '@/shared/files';
import type { RemoteGatewayTransport } from '@/shared/remote-gateway';

import { createStartRemoteProcessingController } from '../startRemoteProcessing';

const NOW = Date.parse('2026-09-02T12:01:00.000Z');

function capabilities(enabled = true) {
    return {
        contractVersion: '1.0',
        gatewayKey: 'gateway-alpha',
        generatedAt: '2026-09-02T12:00:00.000Z',
        validUntil: '2026-09-02T12:05:00.000Z',
        enabled,
        supportedLanguages: ['ja', 'pt-BR'],
        supportedPairs: [{ source: 'ja', target: 'pt-BR' }],
        mediaLimits: { mimeTypes: ['image/jpeg'], maxBytes: 1_000, maxWidthPx: 2_000, maxHeightPx: 2_000, maxPixels: 4_000_000 },
        dailyInstallationQuota: 20,
        dailyGlobalQuota: 100,
        disclosure: {
            version: 'legal-v1',
            operatorName: 'Toonlira',
            operatorContact: 'privacy@toonlira.com',
            privacyPolicyUrl: 'https://toonlira.com/privacy',
            termsUrl: 'https://toonlira.com/terms',
            gatewayRegion: 'southamerica-east1',
            ocrRegion: 'us',
            translationLocation: 'global',
            originalRetentionSeconds: 3600,
            resultRetentionSeconds: 3600,
            metadataRetentionDays: 7,
            providerTrainingPolicy: 'No training.',
        },
    };
}

const project: TranslationProject = {
    id: 'project-1',
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    status: 'DRAFT',
    createdAt: NOW - 10,
    updatedAt: NOW - 10,
    statusUpdatedAt: NOW - 10,
    languageReviewRequired: false,
    pages: [
        {
            id: 'page-1',
            projectId: 'project-1',
            position: 0,
            originalFilename: 'private.jpg',
            originalByteSize: 100,
            originalMimeType: 'image/jpeg',
            widthPx: 100,
            heightPx: 200,
            mediaValidatedAt: NOW - 20,
            mediaValidationPolicyVersion: 1,
            status: 'DRAFT',
            createdAt: NOW - 10,
            updatedAt: NOW - 10,
            statusUpdatedAt: NOW - 10,
        },
    ],
};

const created: RemoteProcessingAttempt = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    pageId: 'page-1',
    attemptNumber: 1,
    idempotencyKey: '550e8400-e29b-41d4-a716-446655440002',
    gatewayKey: 'gateway-alpha',
    gatewayContractVersion: '1.0',
    status: 'CREATED',
    remoteStatus: null,
    remoteJobRef: null,
    errorCode: null,
    createdAt: NOW,
    updatedAt: NOW,
    submittedAt: null,
    acceptedAt: null,
    lastQueriedAt: null,
    cancellationRequestedAt: null,
    cancelledAt: null,
};

function setup(options: { consent?: boolean; enabled?: boolean; capabilityBody?: unknown; upload?: () => Promise<unknown> } = {}) {
    const projects = {
        initialize: jest.fn(async () => undefined),
        getById: jest.fn(async () => project),
        getLatest: jest.fn(async () => project),
    } as unknown as jest.Mocked<TranslationProjectRepository>;
    const attempts = {
        initialize: jest.fn(async () => undefined),
        saveConsent: jest.fn(async () => undefined),
        getConsent: jest.fn(async () =>
            options.consent === false ? null : { projectId: project.id, disclosureVersion: 'legal-v1', presentedLocale: 'pt-BR', acceptedAt: NOW },
        ),
        createOrGetActive: jest.fn(async () => created),
        getLatestByPage: jest.fn(async () => null),
        markSubmitting: jest.fn(async () => ({ ...created, status: 'SUBMITTING', submittedAt: NOW })),
        markUnknown: jest.fn(async () => ({ ...created, status: 'UNKNOWN', errorCode: 'submission-unknown' })),
        markRejected: jest.fn(async () => ({ ...created, status: 'REJECTED', errorCode: 'gateway-rejected' })),
        acceptAndQueue: jest.fn(async () => ({ ...created, status: 'ACCEPTED', remoteStatus: 'QUEUED', remoteJobRef: '550e8400-e29b-41d4-a716-446655440003' })),
        listRecoverable: jest.fn(async () => []),
        getProjectIdForPage: jest.fn(async () => project.id),
        confirmCancelled: jest.fn(),
        observe: jest.fn(),
    } as unknown as jest.Mocked<RemoteProcessingAttemptRepository>;
    const body = capabilities(options.enabled ?? true);
    const upload = jest.fn(
        options.upload ??
            (async () => ({
                status: 202,
                headers: {},
                body: { contractVersion: '1.0', jobRef: '550e8400-e29b-41d4-a716-446655440003', status: 'QUEUED', serverTime: '2026-09-02T12:01:01.000Z' },
            })),
    );
    const transport = {
        request: jest.fn(async () => ({ status: 200, headers: {}, body: options.capabilityBody ?? body })),
        upload,
    } as unknown as jest.Mocked<RemoteGatewayTransport>;
    const identity = {
        getSession: jest.fn(async () => ({ accessToken: 's'.repeat(43), expiresAt: NOW + 60_000 })),
        clear: jest.fn(),
    } as unknown as jest.Mocked<RemoteProcessingIdentity>;
    const files = { fileExists: jest.fn(async () => true), fileUri: jest.fn(() => 'file:///private/page.jpg') } as unknown as jest.Mocked<PrivateBatchFiles>;
    let uuid = 0;
    const controller = createStartRemoteProcessingController({
        projects,
        attempts,
        identity,
        files,
        createTransport: () => transport,
        now: () => NOW,
        uuid: () => `550e8400-e29b-41d4-a716-44665544000${++uuid}`,
    });
    return { controller, projects, attempts, identity, files, transport, upload };
}

describe('MOB-FEAT-017 start remote processing', () => {
    it.each([
        'ocr-invalid-media',
        'ocr-invalid-response',
        'ocr-unavailable',
        'translation-invalid-request',
        'translation-invalid-response',
        'translation-unavailable',
    ])('observes FAILED with worker error %s without uploading again', async code => {
        const fixture = setup();
        const accepted = { ...created, status: 'ACCEPTED' as const, remoteJobRef: '550e8400-e29b-41d4-a716-446655440003' };
        fixture.attempts.listRecoverable.mockResolvedValue([accepted]);
        fixture.transport.request.mockResolvedValueOnce({ status: 200, headers: {} as Headers, body: capabilities() }).mockResolvedValueOnce({
            status: 200,
            headers: {} as Headers,
            body: { contractVersion: '1.0', jobRef: accepted.remoteJobRef, status: 'FAILED', serverTime: '2026-09-02T12:01:00.000Z', error: { code } },
        });

        await fixture.controller.reconcile();

        expect(fixture.attempts.observe).toHaveBeenCalledWith(accepted.id, 'FAILED', NOW);
        expect(fixture.attempts.confirmCancelled).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it.each(['QUEUED', 'FAILED', 'CANCEL_PENDING', 'CANCELLED'])('ignores a %s receipt for another job', async status => {
        const fixture = setup();
        fixture.attempts.listRecoverable.mockResolvedValue([{ ...created, status: 'ACCEPTED', remoteJobRef: '550e8400-e29b-41d4-a716-446655440003' }]);
        fixture.transport.request.mockResolvedValueOnce({ status: 200, headers: {} as Headers, body: capabilities() }).mockResolvedValueOnce({
            status: 200,
            headers: {} as Headers,
            body: { contractVersion: '1.0', jobRef: '550e8400-e29b-41d4-a716-446655440099', status, serverTime: '2026-09-02T12:01:00.000Z' },
        });

        await fixture.controller.reconcile();

        expect(fixture.attempts.getProjectIdForPage).not.toHaveBeenCalled();
        expect(fixture.attempts.observe).not.toHaveBeenCalled();
        expect(fixture.attempts.confirmCancelled).not.toHaveBeenCalled();
        expect(fixture.attempts.acceptAndQueue).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it.each([null, '550e8400-e29b-41d4-a716-446655440003'])('does not apply a receipt from a different attempt contract (job=%s)', async remoteJobRef => {
        const fixture = setup();
        fixture.attempts.listRecoverable.mockResolvedValue([{ ...created, status: 'UNKNOWN', gatewayContractVersion: '2.0', remoteJobRef }]);
        fixture.transport.request.mockResolvedValueOnce({ status: 200, headers: {} as Headers, body: capabilities() }).mockResolvedValueOnce({
            status: 200,
            headers: {} as Headers,
            body: { contractVersion: '1.0', jobRef: '550e8400-e29b-41d4-a716-446655440003', status: 'QUEUED', serverTime: '2026-09-02T12:01:00.000Z' },
        });

        await fixture.controller.reconcile();

        expect(fixture.attempts.getProjectIdForPage).not.toHaveBeenCalled();
        expect(fixture.attempts.observe).not.toHaveBeenCalled();
        expect(fixture.attempts.acceptAndQueue).not.toHaveBeenCalled();
        expect(fixture.attempts.confirmCancelled).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('binds an unknown job only through the idempotency lookup with the expected contract', async () => {
        const fixture = setup();
        fixture.attempts.listRecoverable.mockResolvedValue([{ ...created, status: 'UNKNOWN' }]);
        const jobRef = '550e8400-e29b-41d4-a716-446655440003';
        fixture.transport.request.mockResolvedValueOnce({ status: 200, headers: {} as Headers, body: capabilities() }).mockResolvedValueOnce({
            status: 200,
            headers: {} as Headers,
            body: { contractVersion: '1.0', jobRef, status: 'QUEUED', serverTime: '2026-09-02T12:01:00.000Z' },
        });

        await fixture.controller.reconcile();

        expect(fixture.transport.request).toHaveBeenLastCalledWith(`/v1/page-jobs/by-idempotency/${created.idempotencyKey}`, expect.anything());
        expect(fixture.attempts.acceptAndQueue).toHaveBeenCalledWith(created.id, project.id, created.pageId, jobRef, 'QUEUED', NOW);
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('does not query or replay a missing job under a different gateway contract', async () => {
        const fixture = setup();
        fixture.attempts.listRecoverable.mockResolvedValue([{ ...created, status: 'UNKNOWN', gatewayContractVersion: '2.0' }]);
        fixture.transport.request.mockImplementation(async path => ({
            status: path === '/v1/capabilities' ? 200 : 404,
            headers: new Headers(),
            body: path === '/v1/capabilities' ? capabilities() : null,
        }));

        await fixture.controller.reconcile();

        expect(fixture.transport.request).toHaveBeenCalledTimes(1);
        expect(fixture.attempts.getProjectIdForPage).not.toHaveBeenCalled();
        expect(fixture.attempts.markSubmitting).not.toHaveBeenCalled();
        expect(fixture.files.fileExists).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('rejects a removed operational pair before consent, credentials, attempts or media access', async () => {
        const body = capabilities();
        body.supportedPairs = [{ source: 'pt-BR', target: 'ja' }];
        const fixture = setup({ capabilityBody: body });
        await expect(fixture.controller.submit(project.id)).resolves.toMatchObject({ error: 'unsupported-pair' });
        expect(fixture.attempts.getConsent).not.toHaveBeenCalled();
        expect(fixture.attempts.createOrGetActive).not.toHaveBeenCalled();
        expect(fixture.identity.getSession).not.toHaveBeenCalled();
        expect(fixture.files.fileExists).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('sends zero media bytes when consent is absent or the gateway is disabled', async () => {
        const missingConsent = setup({ consent: false });
        await expect(missingConsent.controller.submit(project.id)).resolves.toMatchObject({ error: 'consent-required' });
        expect(missingConsent.attempts.createOrGetActive).not.toHaveBeenCalled();
        expect(missingConsent.upload).not.toHaveBeenCalled();

        const disabled = setup({ enabled: false });
        await expect(disabled.controller.submit(project.id)).resolves.toMatchObject({ error: 'capabilities-unavailable' });
        expect(disabled.attempts.getConsent).not.toHaveBeenCalled();
        expect(disabled.upload).not.toHaveBeenCalled();
    });

    it('does not create an attempt or send media for the superseded location shape', async () => {
        const legacy = capabilities();
        const oldDisclosure: Record<string, unknown> = { ...legacy.disclosure };
        delete oldDisclosure.ocrRegion;
        delete oldDisclosure.translationLocation;
        const fixture = setup({ capabilityBody: { ...legacy, disclosure: { ...oldDisclosure, processingRegions: ['us', 'us-central1'] } } });

        await expect(fixture.controller.submit(project.id)).resolves.toMatchObject({ error: 'capabilities-unavailable' });
        expect(fixture.attempts.createOrGetActive).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('does not send media under the superseded disclosure version even with the new shape', async () => {
        const legacy = capabilities();
        legacy.disclosure.version = '2026-09-07.v1';
        const fixture = setup({ capabilityBody: legacy });

        await expect(fixture.controller.submit(project.id)).resolves.toMatchObject({ error: 'capabilities-unavailable' });
        expect(fixture.attempts.createOrGetActive).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('persists one attempt before upload and atomically records an accepted receipt', async () => {
        const fixture = setup();
        const first = fixture.controller.submit(project.id);
        const second = fixture.controller.submit(project.id);
        await expect(first).resolves.toMatchObject({ error: null });
        await expect(second).resolves.toMatchObject({ error: null });

        expect(fixture.attempts.createOrGetActive).toHaveBeenCalledTimes(1);
        expect(fixture.upload).toHaveBeenCalledTimes(1);
        expect(fixture.attempts.createOrGetActive.mock.invocationCallOrder[0]).toBeLessThan(fixture.upload.mock.invocationCallOrder[0]!);
        expect(fixture.upload).toHaveBeenCalledWith(
            '/v1/page-jobs',
            expect.objectContaining({ attemptRef: created.id, sourceLanguage: 'ja', targetLanguage: 'pt-BR' }),
            expect.objectContaining({ uri: 'file:///private/page.jpg', mimeType: 'image/jpeg' }),
            expect.objectContaining({ headers: { 'Idempotency-Key': created.idempotencyKey } }),
        );
        expect(fixture.attempts.acceptAndQueue).toHaveBeenCalledWith(created.id, project.id, project.pages[0]!.id, expect.any(String), 'QUEUED', NOW);
    });

    it('submits only the first ordered page even when the project array is reversed', async () => {
        const fixture = setup();
        const firstPage = project.pages[0]!;
        const secondPage = { ...firstPage, id: 'page-2', position: 1, originalFilename: 'second-private.jpg' };
        const multiPageProject = { ...project, pages: [secondPage, firstPage] };
        fixture.projects.getById.mockResolvedValue(multiPageProject);
        fixture.projects.getLatest.mockResolvedValue(multiPageProject);
        fixture.files.fileUri.mockImplementation((_namespace, _projectId, filename) => `file:///private/${filename}`);

        await expect(fixture.controller.submit(project.id)).resolves.toMatchObject({ error: null });

        expect(fixture.attempts.createOrGetActive).toHaveBeenCalledTimes(1);
        expect(fixture.attempts.createOrGetActive).toHaveBeenCalledWith(expect.objectContaining({ pageId: firstPage.id }));
        expect(fixture.files.fileExists).toHaveBeenCalledTimes(1);
        expect(fixture.files.fileExists).toHaveBeenCalledWith(expect.any(String), project.id, firstPage.originalFilename);
        expect(fixture.upload).toHaveBeenCalledTimes(1);
        expect(fixture.upload).toHaveBeenCalledWith(
            '/v1/page-jobs',
            expect.anything(),
            expect.objectContaining({ uri: `file:///private/${firstPage.originalFilename}` }),
            expect.anything(),
        );
        expect(fixture.attempts.acceptAndQueue).toHaveBeenCalledWith(created.id, project.id, firstPage.id, expect.any(String), 'QUEUED', NOW);
        expect(fixture.attempts.getLatestByPage).toHaveBeenCalledWith(firstPage.id);
        expect(fixture.attempts.getLatestByPage).not.toHaveBeenCalledWith(secondPage.id);
        expect(multiPageProject.pages).toEqual([secondPage, firstPage]);
    });

    it('does not fall back to the next page when the first ordered page is invalid', async () => {
        const fixture = setup();
        const firstPage = { ...project.pages[0]!, status: 'FAILED' as const };
        const secondPage = { ...project.pages[0]!, id: 'page-2', position: 1, originalFilename: 'second-private.jpg' };
        const multiPageProject = { ...project, pages: [secondPage, firstPage] };
        fixture.projects.getById.mockResolvedValue(multiPageProject);
        fixture.projects.getLatest.mockResolvedValue(multiPageProject);

        await expect(fixture.controller.submit(project.id)).resolves.toMatchObject({ error: 'capabilities-unavailable' });

        expect(fixture.attempts.getConsent).not.toHaveBeenCalled();
        expect(fixture.attempts.createOrGetActive).not.toHaveBeenCalled();
        expect(fixture.files.fileExists).not.toHaveBeenCalled();
        expect(fixture.identity.getSession).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('preserves the same durable attempt as UNKNOWN after an ambiguous upload failure', async () => {
        const fixture = setup({
            upload: async () => {
                throw new Error('network');
            },
        });

        await expect(fixture.controller.submit(project.id)).resolves.toMatchObject({ error: 'submission-unknown' });

        expect(fixture.attempts.markUnknown).toHaveBeenCalledWith(created.id, NOW);
        expect(fixture.attempts.markRejected).not.toHaveBeenCalled();
    });

    it('records consent only after explicit acceptance and scopes it to project, version and locale', async () => {
        const fixture = setup();
        await fixture.controller.acceptConsent(project.id, capabilities() as never, 'es-ES');
        expect(fixture.attempts.saveConsent).toHaveBeenCalledWith({
            projectId: project.id,
            disclosureVersion: 'legal-v1',
            presentedLocale: 'es-ES',
            acceptedAt: NOW,
        });
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('coalesces overlapping recovery polls, replays once, and allows a later fresh poll', async () => {
        const fixture = setup();
        const unknown = { ...created, status: 'UNKNOWN' as const };
        fixture.attempts.listRecoverable.mockResolvedValue([unknown]);
        let release!: () => void;
        const pending = new Promise<void>(resolve => {
            release = resolve;
        });
        fixture.transport.request.mockImplementation(async path => {
            if (path === '/v1/capabilities') {
                await pending;
                return { status: 200, headers: {} as Headers, body: capabilities() };
            }
            return { status: 404, headers: {} as Headers, body: null };
        });
        const operations = Array.from({ length: 3 }, () => fixture.controller.reconcile());
        release();
        const results = await Promise.all(operations);
        expect(results.every(result => result.error === null)).toBe(true);
        expect({
            recoverableReads: fixture.attempts.listRecoverable.mock.calls.length,
            sessions: fixture.identity.getSession.mock.calls.length,
            requests: fixture.transport.request.mock.calls.length,
            uploads: fixture.upload.mock.calls.length,
        }).toEqual({ recoverableReads: 1, sessions: 1, requests: 2, uploads: 1 });
        expect(fixture.attempts.createOrGetActive).not.toHaveBeenCalled();
        expect(fixture.upload).toHaveBeenCalledWith(
            '/v1/page-jobs',
            expect.anything(),
            expect.anything(),
            expect.objectContaining({ headers: { 'Idempotency-Key': unknown.idempotencyKey } }),
        );

        fixture.attempts.listRecoverable.mockResolvedValue([]);
        await fixture.controller.reconcile();
        expect(fixture.attempts.listRecoverable).toHaveBeenCalledTimes(2);
        expect(fixture.transport.request).toHaveBeenCalledTimes(3);
        expect(fixture.upload).toHaveBeenCalledTimes(1);
    });

    it('finds attempts added during a status query on the next poll without creating a background queue', async () => {
        const fixture = setup();
        const first = { ...created, status: 'UNKNOWN' as const, remoteJobRef: '550e8400-e29b-41d4-a716-446655440003' };
        const added = { ...first, id: 'attempt-added', pageId: 'page-added', remoteJobRef: '550e8400-e29b-41d4-a716-446655440004' };
        fixture.attempts.listRecoverable.mockResolvedValue([first]);
        let queryStarted!: () => void;
        const started = new Promise<void>(resolve => {
            queryStarted = resolve;
        });
        let release!: () => void;
        const pending = new Promise<void>(resolve => {
            release = resolve;
        });
        fixture.transport.request.mockImplementation(async path => {
            if (path === '/v1/capabilities') return { status: 200, headers: {} as Headers, body: capabilities() };
            if (path.endsWith(first.remoteJobRef)) {
                queryStarted();
                await pending;
            }
            return {
                status: 200,
                headers: {} as Headers,
                body: {
                    contractVersion: '1.0',
                    jobRef: path.endsWith(first.remoteJobRef) ? first.remoteJobRef : added.remoteJobRef,
                    status: 'QUEUED',
                    serverTime: '2026-09-02T12:01:01.000Z',
                },
            };
        });

        const running = fixture.controller.reconcile();
        await started;
        fixture.attempts.listRecoverable.mockResolvedValue([added]);
        const overlapping = fixture.controller.reconcile();
        expect(overlapping).toBe(running);
        release();
        await Promise.all([running, overlapping]);
        expect(fixture.attempts.listRecoverable).toHaveBeenCalledTimes(1);
        expect(fixture.attempts.observe).toHaveBeenCalledTimes(1);
        expect(fixture.attempts.observe).toHaveBeenCalledWith(first.id, 'QUEUED', NOW);

        await fixture.controller.reconcile();
        expect(fixture.attempts.listRecoverable).toHaveBeenCalledTimes(2);
        expect(fixture.attempts.observe).toHaveBeenCalledTimes(2);
        expect(fixture.attempts.observe).toHaveBeenLastCalledWith(added.id, 'QUEUED', NOW);
        expect(fixture.attempts.createOrGetActive).not.toHaveBeenCalled();
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('shares the same signal but keeps independent cancellation owners isolated', async () => {
        const fixture = setup();
        const owner = new AbortController();
        let release!: () => void;
        const pending = new Promise<void>(resolve => {
            release = resolve;
        });
        fixture.transport.request.mockImplementation(async (_path, options) => {
            await pending;
            if (options?.signal?.aborted) throw new Error('aborted');
            return { status: 200, headers: {} as Headers, body: capabilities() };
        });
        const cancelled = fixture.controller.reconcile(owner.signal);
        const sameOwner = fixture.controller.reconcile(owner.signal);
        const independent = fixture.controller.reconcile();
        owner.abort();
        release();
        await expect(cancelled).resolves.toMatchObject({ error: 'submission-unknown' });
        await expect(sameOwner).resolves.toMatchObject({ error: 'submission-unknown' });
        await expect(independent).resolves.toMatchObject({ error: null });
        expect(fixture.transport.request).toHaveBeenCalledTimes(2);
        expect(fixture.attempts.listRecoverable).toHaveBeenCalledTimes(1);
    });

    it('does not retain a failed network snapshot as a cache', async () => {
        const fixture = setup();
        fixture.transport.request.mockRejectedValueOnce(new Error('network'));
        await expect(fixture.controller.reconcile()).resolves.toMatchObject({ error: 'submission-unknown' });
        await expect(fixture.controller.reconcile()).resolves.toMatchObject({ error: null });
        expect(fixture.transport.request).toHaveBeenCalledTimes(2);
    });

    it('releases recovery after snapshot failure so a later retry can run', async () => {
        const fixture = setup();
        fixture.projects.getLatest.mockRejectedValueOnce(new Error('storage-unavailable'));
        await expect(fixture.controller.reconcile()).rejects.toThrow('storage-unavailable');
        await expect(fixture.controller.reconcile()).resolves.toMatchObject({ error: null });
        expect(fixture.transport.request).toHaveBeenCalledTimes(2);
    });

    it('does not replay without consent or with a disabled gateway during coalesced recovery', async () => {
        for (const options of [{ consent: false }, { enabled: false }]) {
            const fixture = setup(options);
            fixture.attempts.listRecoverable.mockResolvedValue([{ ...created, status: 'UNKNOWN' }]);
            fixture.transport.request.mockImplementation(async path => ({
                status: path === '/v1/capabilities' ? 200 : 404,
                headers: {} as Headers,
                body: path === '/v1/capabilities' ? capabilities(options.enabled ?? true) : null,
            }));
            await Promise.all([fixture.controller.reconcile(), fixture.controller.reconcile()]);
            expect(fixture.upload).not.toHaveBeenCalled();
            expect(fixture.attempts.listRecoverable).toHaveBeenCalledTimes(1);
        }
    });

    it('replays a confirmed-missing ambiguous submission with the same attempt and idempotency key', async () => {
        const fixture = setup();
        const unknown = { ...created, status: 'UNKNOWN' as const, errorCode: 'submission-unknown' as const };
        fixture.attempts.listRecoverable.mockResolvedValue([unknown]);
        fixture.attempts.markSubmitting.mockResolvedValue({ ...unknown, status: 'SUBMITTING' });
        fixture.transport.request
            .mockResolvedValueOnce({ status: 200, headers: {} as Headers, body: capabilities() })
            .mockResolvedValueOnce({ status: 404, headers: {} as Headers, body: null });

        await fixture.controller.reconcile();

        expect(fixture.upload).toHaveBeenCalledWith(
            '/v1/page-jobs',
            expect.objectContaining({ attemptRef: unknown.id }),
            expect.anything(),
            expect.objectContaining({ headers: { 'Idempotency-Key': unknown.idempotencyKey } }),
        );
        expect(fixture.attempts.createOrGetActive).not.toHaveBeenCalled();
    });
});
