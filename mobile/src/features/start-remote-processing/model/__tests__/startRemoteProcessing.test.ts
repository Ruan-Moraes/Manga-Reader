import {
    interruptVolatileDelivery,
    type RemoteProcessingAttempt,
    type RemoteProcessingAttemptRepository,
    takeVolatileDelivery,
} from '@/entities/remote-processing-attempt';
import type { RemoteProcessingIdentity } from '@/entities/remote-processing-identity';
import type { TranslationProject, TranslationProjectRepository } from '@/entities/translation-project';
import type { PrivateBatchFiles } from '@/shared/files';
import { type RemoteGatewayTransport, VolatileTranslationTransportError } from '@/shared/remote-gateway';

import { createStartRemoteProcessingController } from '../startRemoteProcessing';

const NOW = Date.parse('2026-11-01T12:01:00.000Z');
const CHAPTER = '6f1c2a10-1111-4222-8333-444455556666';
let TERMS: { source: string; target: string }[] = [];
const OPERATION = '550e8400-e29b-41d4-a716-446655440003';
const HASH = 'a'.repeat(64);
const jpeg = () => new Uint8Array([255, 216, 255, 192, 0, 17, 8, 0, 200, 0, 100, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0, 255, 217]);
function capabilities(enabled = true) {
    return {
        contractVersion: '2.0',
        transport: 'volatile-direct-response',
        gatewayKey: 'gateway-alpha',
        generatedAt: '2026-11-01T12:00:00.000Z',
        validUntil: '2026-11-01T12:05:00.000Z',
        enabled,
        supportedLanguages: ['ja', 'pt-BR'],
        supportedPairs: [{ source: 'ja', target: 'pt-BR' }],
        mediaLimits: {
            mimeTypes: ['image/jpeg'],
            maxBytes: 1000,
            maxWidthPx: 2000,
            maxHeightPx: 2000,
            maxPixels: 4000000,
            maxResultBytes: 67108864,
            maxManifestBytes: 4194304,
        },
        dailyInstallationQuota: 20,
        dailyGlobalQuota: 100,
        disclosure: {
            version: 'volatile-1',
            operatorName: 'Toonlira',
            operatorContact: 'privacy@example.test',
            privacyPolicyUrl: 'https://example.test/privacy',
            termsUrl: 'https://example.test/terms',
            gatewayRegion: 'southamerica-east1',
            ocrRegion: 'us',
            translationLocation: 'global',
            languageModelLocation: null,
            contentProcessing: 'in-memory-only',
            resultStorage: 'user-device',
            sanitizedOperationalLogs: true,
            idempotencyKeyFormat: 'uuid-v7',
            receiptValiditySeconds: 604800,
            providerTrainingPolicy: 'No training.',
        },
    };
}
function setup(options: { consent?: boolean; enabled?: boolean; exists?: boolean } = {}) {
    const project: TranslationProject = {
        id: 'project',
        sourceLanguage: 'ja',
        targetLanguage: 'pt-BR',
        status: 'DRAFT',
        createdAt: NOW - 10,
        updatedAt: NOW - 10,
        statusUpdatedAt: NOW - 10,
        languageReviewRequired: false,
        pages: [
            {
                id: 'page',
                projectId: 'project',
                position: 0,
                originalFilename: 'original',
                originalByteSize: jpeg().length,
                originalMimeType: 'image/jpeg',
                widthPx: 100,
                heightPx: 200,
                mediaValidatedAt: NOW - 10,
                mediaValidationPolicyVersion: 1,
                status: 'DRAFT',
                createdAt: NOW - 10,
                updatedAt: NOW - 10,
                statusUpdatedAt: NOW - 10,
            },
        ],
    };
    let attempt: RemoteProcessingAttempt | null = null;
    const created: RemoteProcessingAttempt = {
        id: 'attempt',
        pageId: 'page',
        attemptNumber: 1,
        idempotencyKey: '019a3d00-0000-7000-8000-000000000001',
        gatewayKey: 'gateway-alpha',
        gatewayContractVersion: '2.0',
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
    const projects = {
        initialize: jest.fn(async () => undefined),
        getById: jest.fn(async () => project),
        getLatest: jest.fn(async () => project),
        // MOB-FEAT-022/023: the project's chapter reference and the names its earlier pages decided.
        ensureContextRef: jest.fn(async () => CHAPTER),
        listTerms: jest.fn(async () => TERMS),
    } as unknown as jest.Mocked<TranslationProjectRepository>;
    const attempts = {
        initialize: jest.fn(async () => undefined),
        saveConsent: jest.fn(async () => undefined),
        getConsent: jest.fn(async () =>
            options.consent === false ? null : { projectId: 'project', disclosureVersion: 'volatile-1', presentedLocale: 'pt-BR', acceptedAt: NOW },
        ),
        createOrGetActive: jest.fn(async () => attempt ?? (attempt = { ...created })),
        getLatestByPage: jest.fn(async () => attempt),
        listRecoverable: jest.fn(async () => (attempt ? [attempt] : [])),
        markSubmitting: jest.fn(async () => (attempt = { ...attempt!, status: 'SUBMITTING' })),
        markUnknown: jest.fn(async () => (attempt = { ...attempt!, status: 'UNKNOWN' })),
        markRejected: jest.fn(async () => (attempt = { ...attempt!, status: 'REJECTED' })),
        observeVolatileReceipt: jest.fn(async (_id, receipt) => {
            if (receipt && receipt.status !== 'STARTED') project.pages[0]!.status = 'FAILED';
            return (attempt = {
                ...attempt!,
                remoteJobRef: receipt?.operationRef ?? attempt?.remoteJobRef ?? null,
                volatileReceiptStatus: receipt?.status ?? null,
                status: receipt ? (receipt.status === 'STARTED' ? 'UNKNOWN' : 'FAILED') : attempt!.status,
            });
        }),
        acceptDirectResponse: jest.fn(async () => {
            project.status = 'PROCESSING';
            project.pages[0]!.status = 'PROCESSING';
            return (attempt = { ...attempt!, status: 'ACCEPTED', remoteStatus: 'READY', remoteJobRef: OPERATION });
        }),
        failVolatileAttempt: jest.fn(async () => {
            project.pages[0]!.status = 'FAILED';
            return (attempt = { ...attempt!, status: 'FAILED' });
        }),
    } as unknown as jest.Mocked<RemoteProcessingAttemptRepository>;
    const body = capabilities(options.enabled ?? true);
    const request = jest.fn(async (_path: string, _options?: unknown) => ({ status: 200, headers: new Headers(), body }));
    const upload = jest.fn();
    const transport = { request, upload } as unknown as RemoteGatewayTransport;
    const identity = {
        getSession: jest.fn(async () => ({ accessToken: 'opaque-token', expiresAt: NOW + 10000 })),
    } as unknown as jest.Mocked<RemoteProcessingIdentity>;
    const files = {
        fileExists: jest.fn(async () => options.exists !== false),
        fileUri: jest.fn((_n: string, _p: string, name: string) => `private://${name}`),
    } as unknown as jest.Mocked<PrivateBatchFiles>;
    const manifest = new TextEncoder().encode(JSON.stringify({ jobRef: OPERATION, originalSha256: HASH, sourceLanguage: 'ja', targetLanguage: 'pt-BR' }));
    const dispose = jest.fn();
    const processPage = jest.fn(async () => ({ manifest, image: new Uint8Array([1, 2, 3]), dispose }));
    const seedGlossary = jest.fn(async () => undefined);
    const readBytes = jest.fn(async () => jpeg());
    const controller = createStartRemoteProcessingController({
        projects,
        attempts,
        identity,
        files,
        createTransport: () => transport,
        createVolatileTransport: () => ({ process: processPage, seedGlossary }),
        readBytes,
        hashBytes: async () => HASH,
        now: () => NOW,
        uuid: () => '550e8400-e29b-41d4-a716-446655440001',
    });
    return {
        controller,
        seedGlossary,
        project,
        projects,
        created,
        attempts,
        identity,
        files,
        body,
        request,
        upload,
        processPage,
        dispose,
        readBytes,
        setAttempt: (value: RemoteProcessingAttempt) => (attempt = value),
    };
}
afterEach(() => interruptVolatileDelivery('attempt'));

it.each(['PROCESSING', 'READY'] as const)('submits the requested page when the chapter is %s', async chapterStatus => {
    const d = setup();
    const second: TranslationProject['pages'][number] = { ...d.project.pages[0]!, id: 'page-2', position: 1, originalFilename: 'second', status: 'DRAFT' };
    d.project.pages[0]!.status = 'READY';
    d.project.status = chapterStatus;
    d.project.pages.push(second);
    d.setAttempt({ ...d.created, pageId: 'page-2' });
    d.attempts.acceptDirectResponse.mockImplementation(async () => {
        second.status = 'PROCESSING';
        d.project.status = 'PROCESSING';
        const accepted = { ...d.created, pageId: 'page-2', status: 'ACCEPTED' as const, remoteStatus: 'READY' as const, remoteJobRef: OPERATION };
        d.setAttempt(accepted);
        return accepted;
    });
    const result = await d.controller.submit('project', undefined, 'page-2');
    expect(d.attempts.createOrGetActive).toHaveBeenCalledWith(expect.objectContaining({ pageId: 'page-2' }));
    expect(d.files.fileUri).toHaveBeenCalledWith('translation-projects', 'project', 'second');
    expect(result.attempt?.pageId).toBe('page-2');
    expect(d.project.pages[0]?.status).toBe('READY');
    expect(d.processPage).toHaveBeenCalledTimes(1);
});

it.each([{ consent: false }, { enabled: false }, { exists: false }])('sends zero image bytes when a prerequisite is missing %j', async options => {
    const d = setup(options);
    await d.controller.submit('project');
    expect(d.processPage).not.toHaveBeenCalled();
    expect(d.upload).not.toHaveBeenCalled();
});
it('requires a fresh volatile contract and consent instead of accepting the old retention shape', async () => {
    const d = setup();
    Object.assign(d.body, { contractVersion: '1.0' });
    expect((await d.controller.submit('project')).error).toBe('capabilities-unavailable');
    expect(d.processPage).not.toHaveBeenCalled();
});
it('persists the attempt before one raw request and transfers only a received response', async () => {
    const d = setup();
    const first = d.controller.submit('project');
    expect(d.controller.submit('project')).toBe(first);
    const result = await first;
    expect(result.attempt?.status).toBe('ACCEPTED');
    expect(result.project?.status).toBe('PROCESSING');
    expect(d.attempts.createOrGetActive.mock.invocationCallOrder[0]).toBeLessThan(d.processPage.mock.invocationCallOrder[0]!);
    expect(d.attempts.createOrGetActive).toHaveBeenCalledWith(
        expect.objectContaining({ gatewayContractVersion: '2.0', idempotencyKey: expect.stringMatching(/-7[0-9a-f]{3}-/) }),
    );
    expect(d.processPage).toHaveBeenCalledTimes(1);
    expect(d.upload).not.toHaveBeenCalled();
    const delivery = takeVolatileDelivery('attempt');
    expect(delivery?.originalSha256).toBe(HASH);
    interruptVolatileDelivery('attempt');
    expect(d.dispose).not.toHaveBeenCalled();
    delivery?.dispose();
    // Consumer ownership is retained even after cancellation until the acquired buffer is disposed.
});
it('revalidates actual bytes before credentials or image transmission', async () => {
    const d = setup();
    d.readBytes.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
    await d.controller.submit('project');
    expect(d.processPage).not.toHaveBeenCalled();
    expect(d.identity.getSession).not.toHaveBeenCalled();
    expect(d.attempts.failVolatileAttempt).toHaveBeenCalled();
});
it('submits the first ordered page and never falls back to a later valid page', async () => {
    const d = setup();
    d.project.pages = [{ ...d.project.pages[0]!, id: 'later', position: 1, originalFilename: 'later' }, d.project.pages[0]!];
    await d.controller.submit('project');
    expect(d.files.fileUri).toHaveBeenCalledWith('translation-projects', 'project', 'original');
    expect(d.attempts.createOrGetActive).toHaveBeenCalledWith(expect.objectContaining({ pageId: 'page' }));
});
it('keeps the same attempted identity UNKNOWN after an ambiguous request without replay', async () => {
    const d = setup();
    d.processPage.mockRejectedValueOnce(new Error('network-private-detail'));
    const result = await d.controller.submit('project');
    expect(result.attempt?.status).toBe('UNKNOWN');
    expect(result.error).toBe('submission-unknown');
    expect(d.processPage).toHaveBeenCalledTimes(1);
    await d.controller.submit('project');
    expect(d.processPage).toHaveBeenCalledTimes(1);
});
it('stops at a quota refusal during capabilities without creating an attempt', async () => {
    const d = setup();
    d.request.mockResolvedValue({ status: 429, headers: new Headers(), body: d.body });
    await expect(d.controller.initialize()).resolves.toMatchObject({ error: 'quota-exceeded' });
    await expect(d.controller.submit('project')).resolves.toMatchObject({ error: 'quota-exceeded' });
    expect(d.attempts.createOrGetActive).not.toHaveBeenCalled();
    expect(d.processPage).not.toHaveBeenCalled();
});
it('records a quota refusal during submission as rejected without changing the page', async () => {
    const d = setup();
    d.processPage.mockRejectedValueOnce(new VolatileTranslationTransportError('quota-exceeded'));
    const result = await d.controller.submit('project');
    expect(result).toMatchObject({ attempt: { status: 'REJECTED' }, error: 'quota-exceeded' });
    expect(d.attempts.markRejected).toHaveBeenCalledWith('attempt', NOW, 'gateway-rejected');
    expect(d.attempts.markUnknown).not.toHaveBeenCalled();
    expect(d.project.pages[0]?.status).toBe('DRAFT');
    expect(d.processPage).toHaveBeenCalledTimes(1);
});
it.each(['STARTED', 'FINISHED', 'FAILED', 'missing'])('reconciles %s only through metadata, never a new upload', async status => {
    const d = setup();
    d.setAttempt({ ...d.created, status: 'UNKNOWN' });
    d.request.mockImplementation(async path =>
        path === '/v2/capabilities'
            ? { status: 200, headers: new Headers(), body: d.body }
            : ({
                  status: status === 'missing' ? 404 : 200,
                  headers: new Headers(),
                  body: {
                      contractVersion: '2.0',
                      contentRecoverable: false,
                      receipt: {
                          operationRef: OPERATION,
                          status,
                          createdAt: '2026-11-01T12:00:00Z',
                          finishedAt: status === 'STARTED' ? null : '2026-11-01T12:00:01Z',
                          errorCode: status === 'FAILED' ? 'internal-error' : null,
                      },
                  },
              } as never),
    );
    const pending = d.controller.reconcile();
    expect(d.controller.reconcile()).toBe(pending);
    const result = await pending;
    expect(result.attempt?.volatileReceiptStatus).toBe(status === 'missing' ? null : status);
    expect(d.attempts.observeVolatileReceipt).toHaveBeenCalledWith(
        'attempt',
        status === 'missing' ? null : expect.objectContaining({ operationRef: OPERATION, status }),
        NOW,
    );
    expect(d.request).toHaveBeenCalledWith(
        expect.stringContaining('/v2/page-translations/by-idempotency/'),
        expect.objectContaining({ token: 'opaque-token' }),
    );
    expect(d.upload).not.toHaveBeenCalled();
    expect(d.processPage).not.toHaveBeenCalled();
    expect(d.attempts.createOrGetActive).not.toHaveBeenCalled();
    if (status === 'missing') expect(d.attempts.failVolatileAttempt).toHaveBeenCalled();
    else expect(result.attempt?.status).toBe(status === 'STARTED' ? 'UNKNOWN' : 'FAILED');
});
it('does not bind a receipt for another known operation or an incompatible attempt', async () => {
    const d = setup();
    d.setAttempt({ ...d.created, status: 'UNKNOWN', remoteJobRef: '550e8400-e29b-41d4-a716-446655440099' });
    d.request.mockImplementation(async path =>
        path === '/v2/capabilities'
            ? { status: 200, headers: new Headers(), body: d.body }
            : ({
                  status: 200,
                  headers: new Headers(),
                  body: {
                      contractVersion: '2.0',
                      contentRecoverable: false,
                      receipt: {
                          operationRef: OPERATION,
                          status: 'FINISHED',
                          createdAt: '2026-11-01T12:00:00Z',
                          finishedAt: '2026-11-01T12:00:01Z',
                          errorCode: null,
                      },
                  },
              } as never),
    );
    await d.controller.reconcile();
    expect(d.attempts.failVolatileAttempt).not.toHaveBeenCalled();
    expect(d.attempts.acceptDirectResponse).not.toHaveBeenCalled();
});
it('persists affirmative consent scoped by project, version and presented locale', async () => {
    const d = setup();
    await d.controller.initialize();
    expect(d.attempts.saveConsent).not.toHaveBeenCalled();
    const capability = (await d.controller.initialize()).capabilities!;
    await d.controller.acceptConsent('project', capability, 'es-ES');
    expect(d.attempts.saveConsent).toHaveBeenCalledWith({ projectId: 'project', disclosureVersion: 'volatile-1', presentedLocale: 'es-ES', acceptedAt: NOW });
});

it('discards the response if SQLite snapshot loading fails after direct acceptance', async () => {
    const d = setup();
    d.projects.getById.mockImplementation(async () => {
        if (d.attempts.acceptDirectResponse.mock.calls.length) throw new Error('controlled-snapshot-failure');
        return d.project;
    });
    await expect(d.controller.submit('project')).rejects.toThrow('controlled-snapshot-failure');
    expect(d.dispose).toHaveBeenCalledTimes(1);
    expect(d.attempts.failVolatileAttempt).toHaveBeenCalledWith('attempt', NOW, 'submission-unknown');
    expect(takeVolatileDelivery('attempt')).toBeNull();
});

it('does not send a page whose validation metadata was invalidated', async () => {
    const d = setup();
    d.project.pages[0]!.mediaValidationPolicyVersion = 0;
    await d.controller.submit('project');
    expect(d.processPage).not.toHaveBeenCalled();
    expect(d.identity.getSession).not.toHaveBeenCalled();
});

it('records unknown observation after a failed receipt request without replay or losing its operation binding', async () => {
    const d = setup();
    d.setAttempt({ ...d.created, status: 'UNKNOWN', remoteJobRef: OPERATION, volatileReceiptStatus: 'STARTED' });
    d.request.mockImplementation(async path => {
        if (path === '/v2/capabilities') return { status: 200, headers: new Headers(), body: d.body };
        throw new Error('synthetic network failure');
    });
    const result = await d.controller.reconcile();
    expect(result.attempt).toMatchObject({ status: 'UNKNOWN', remoteJobRef: OPERATION, volatileReceiptStatus: null });
    expect(result.error).toBe('submission-unknown');
    expect(d.processPage).not.toHaveBeenCalled();
});

describe('MOB-FEAT-022/023 over the volatile gateway', () => {
    afterEach(() => {
        TERMS = [];
    });

    it("sends the project's chapter reference with the page, and its glossary first when it has names", async () => {
        TERMS = [{ source: 'Coriander', target: 'Coriander' }];
        const d = setup();
        await d.controller.submit('project');
        expect(d.processPage).toHaveBeenCalledWith(expect.objectContaining({ contextRef: CHAPTER }), expect.anything());
        expect(d.seedGlossary).toHaveBeenCalledWith(
            expect.objectContaining({ contextRef: CHAPTER, sourceLanguage: 'ja', targetLanguage: 'pt-BR', terms: TERMS }),
            expect.anything(),
        );
        expect(d.seedGlossary.mock.invocationCallOrder[0]).toBeLessThan(d.processPage.mock.invocationCallOrder[0]!);
    });

    it('sends no glossary without names', async () => {
        const d = setup();
        await d.controller.submit('project');
        expect(d.seedGlossary).not.toHaveBeenCalled();
        expect(d.processPage).toHaveBeenCalledTimes(1);
    });

    it('a refused glossary never stops the page', async () => {
        TERMS = [{ source: 'Coriander', target: 'Coriander' }];
        const d = setup();
        d.seedGlossary.mockRejectedValueOnce(new Error('ambiguous'));
        await d.controller.submit('project');
        expect(d.processPage).toHaveBeenCalledTimes(1);
    });
});
