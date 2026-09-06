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
            operatorName: 'Manga Reader',
            operatorContact: 'privacy@mangareader.app',
            privacyPolicyUrl: 'https://mangareader.app/privacy',
            termsUrl: 'https://mangareader.app/terms',
            gatewayRegion: 'southamerica-east1',
            processingRegions: ['us'],
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

function setup(options: { consent?: boolean; enabled?: boolean; upload?: () => Promise<unknown> } = {}) {
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
    const transport = { request: jest.fn(async () => ({ status: 200, headers: {}, body })), upload } as unknown as jest.Mocked<RemoteGatewayTransport>;
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
