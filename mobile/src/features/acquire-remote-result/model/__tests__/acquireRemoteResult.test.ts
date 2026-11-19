import type { LocalTranslationResult, RemoteResultCommit } from '@/entities/local-translation-result';
import type { RemoteProcessingAttempt } from '@/entities/remote-processing-attempt';
import type { TranslationProject } from '@/entities/translation-project';

import { createAcquireRemoteResultController } from '../acquireRemoteResult';
import { remoteStageIndex } from '../remoteStage';
import { nextPollingDelay } from '../useRemoteResultPolling';

jest.mock('@/entities/local-translation-result', () => ({
    ...jest.requireActual('@/entities/local-translation-result'),
    parseRemoteRenderManifestBytes: jest.fn(async () => ({ version: '1.1', jobRef: JOB, regions: [] })),
}));

const JOB = '30000000-0000-4000-8000-000000000001';
const SERVER = '2026-11-18T12:00:00.000Z';
const URL_BASE = 'https://storage.googleapis.com/bucket/object?X-Goog-Signature=abc';

function attempt(overrides: Partial<RemoteProcessingAttempt> = {}): RemoteProcessingAttempt {
    return {
        id: 'attempt-1',
        pageId: 'page-1',
        attemptNumber: 1,
        idempotencyKey: 'key',
        gatewayKey: 'gateway',
        gatewayContractVersion: '1.0',
        status: 'ACCEPTED',
        remoteStatus: 'QUEUED',
        remoteJobRef: JOB,
        errorCode: null,
        createdAt: 1,
        updatedAt: 1,
        submittedAt: 1,
        acceptedAt: 1,
        lastQueriedAt: null,
        cancellationRequestedAt: null,
        cancelledAt: null,
        resultAcknowledgedAt: null,
        ...overrides,
    };
}

function envelope(status: string, withResult = status === 'READY') {
    return {
        contractVersion: '1.0',
        jobRef: JOB,
        status,
        serverTime: SERVER,
        result: withResult
            ? {
                  manifestVersion: '1.0',
                  widthPx: 100,
                  heightPx: 200,
                  expiresAt: '2026-11-18T12:30:00.000Z',
                  image: { url: URL_BASE, sha256: 'a'.repeat(64), expiresAt: '2026-11-18T12:04:00.000Z', mimeType: 'image/webp', byteSize: 900 },
                  manifest: { url: URL_BASE, sha256: 'b'.repeat(64), expiresAt: '2026-11-18T12:04:00.000Z', mimeType: 'application/json', byteSize: 40 },
              }
            : null,
    };
}

function setup(options: { status?: string; persisted?: boolean; imageHash?: string; ack?: number; jobStatus?: number } = {}) {
    const calls: string[] = [];
    let active = [attempt()];
    const results = new Map<string, LocalTranslationResult>();
    if (options.persisted) {
        results.set('page-1', { pageId: 'page-1', attemptId: 'attempt-1', sourceKind: 'REMOTE', autoOpenedAt: null, readyAt: 5 } as LocalTranslationResult);
    }
    const project = { id: 'project', sourceLanguage: 'en', targetLanguage: 'pt-BR', pages: [] } as unknown as TranslationProject;
    const request = jest.fn(async (path: string, init?: { method?: string }) => {
        calls.push(`${init?.method ?? 'GET'} ${path}`);
        if (path.endsWith('/ack')) return { status: options.ack ?? 202, headers: new Headers(), body: null };
        return { status: options.jobStatus ?? 200, headers: new Headers(), body: envelope(options.status ?? 'READY') };
    });
    const dependencies = {
        projects: { getById: jest.fn(async () => project) },
        attempts: {
            initialize: jest.fn(async () => undefined),
            listActive: jest.fn(async () => active),
            getProjectIdForPage: jest.fn(async () => 'project'),
            advance: jest.fn(async (_id: string, status: string) => {
                calls.push(`advance ${status}`);
                return attempt();
            }),
            markRemoteFailed: jest.fn(async (_id: string, status: string) => {
                calls.push(`failed ${status}`);
                active = [];
                return attempt();
            }),
            markAcknowledged: jest.fn(async () => {
                calls.push('acknowledged');
                active = [];
                return attempt();
            }),
            confirmCancelled: jest.fn(async () => attempt()),
        },
        results: {
            getByPage: jest.fn(async (pageId: string) => results.get(pageId) ?? null),
            listByProject: jest.fn(async () => [...results.values()]),
            saveRemoteResult: jest.fn(async (commit: RemoteResultCommit) => {
                calls.push('commit');
                results.set(commit.pageId, {
                    pageId: commit.pageId,
                    attemptId: commit.attemptId,
                    sourceKind: 'REMOTE',
                    autoOpenedAt: null,
                    readyAt: commit.readyAt,
                } as LocalTranslationResult);
            }),
            markAutoOpened: jest.fn(async (pageId: string, at: number) => {
                calls.push('opened');
                results.set(pageId, { ...results.get(pageId)!, autoOpenedAt: at });
            }),
        },
        identity: { getSession: jest.fn(async () => ({ accessToken: 'token' })) } as never,
        files: {
            stageBatch: jest.fn(async () => {
                calls.push('stage');
                return [];
            }),
            promoteStagedFiles: jest.fn(async () => {
                calls.push('promote');
            }),
            discardStaging: jest.fn(async () => undefined),
            removeFile: jest.fn(async () => {
                calls.push('remove');
            }),
        },
        temporary: {
            download: jest.fn(async (_url: string, name: string) => {
                calls.push(`download ${name.endsWith('image') ? 'image' : 'manifest'}`);
                return { uri: `file:///${name}`, byteSize: name.endsWith('image') ? 900 : 40 };
            }),
            readBytes: jest.fn(async () => new Uint8Array([1])),
            remove: jest.fn(async () => undefined),
        },
        hashFile: jest.fn(async () => options.imageHash ?? 'a'.repeat(64)),
        createTransport: () => ({ request, upload: jest.fn() }),
        loadCapabilities: jest.fn(async () => ({ gatewayKey: 'gateway', contractVersion: '1.0' })) as never,
        now: () => 100,
    };
    return { controller: createAcquireRemoteResultController(dependencies), dependencies, calls };
}

describe('MOB-FEAT-021/AC-001 foreground follow-up', () => {
    it('backs off from 2 s up to 30 s', () => {
        expect([0, 1, 2, 3, 4, 9].map(nextPollingDelay)).toEqual([2000, 4000, 8000, 16000, 30000, 30000]);
    });

    it('maps only confirmed milestones and never shows a bar for terminal states', () => {
        expect(remoteStageIndex('QUEUED', false)).toBe(0);
        expect(remoteStageIndex('TRANSLATING', false)).toBe(2);
        expect(remoteStageIndex('READY', false)).toBe(4);
        expect(remoteStageIndex('READY', true)).toBe(5);
        expect(remoteStageIndex('FAILED', false)).toBeNull();
    });

    it('records the remote stage and keeps following while the page is not ready', async () => {
        const { controller, calls } = setup({ status: 'TRANSLATING' });
        const snapshot = await controller.sync();
        expect(calls).toEqual([`GET /v1/page-jobs/${JOB}`, 'advance TRANSLATING']);
        expect(snapshot).toMatchObject({ active: 1, stages: ['TRANSLATING'], openProjectId: null, error: null });
    });

    it('shares one round between a timer and a return to the foreground', async () => {
        const { controller, dependencies } = setup({ status: 'OCR' });
        await Promise.all([controller.sync(), controller.sync()]);
        expect(dependencies.attempts.listActive).toHaveBeenCalledTimes(2);
    });
});

describe('MOB-FEAT-021/AC-002/003 READY only after local persistence, then ACK, opened once', () => {
    it('downloads, verifies, moves, commits, marks opened and only then acknowledges', async () => {
        const { controller, calls } = setup();
        const snapshot = await controller.sync();
        expect(calls).toEqual([
            `GET /v1/page-jobs/${JOB}`,
            'advance READY',
            'download image',
            'download manifest',
            'stage',
            'promote',
            'commit',
            'opened',
            `POST /v1/page-jobs/${JOB}/ack`,
            'acknowledged',
        ]);
        expect(snapshot).toMatchObject({ active: 0, openProjectId: 'project', error: null });
    });

    it('after a restart between commit and ACK it acknowledges without downloading again', async () => {
        const { controller, calls } = setup({ persisted: true });
        await controller.sync();
        expect(calls.filter(call => call.startsWith('download'))).toEqual([]);
        expect(calls).toContain('acknowledged');
    });

    it('a failed ACK keeps the local result and is retried in the next round', async () => {
        const { controller, dependencies } = setup({ ack: 503 });
        const first = await controller.sync();
        expect(first.active).toBe(1);
        expect(dependencies.attempts.markAcknowledged).not.toHaveBeenCalled();
        expect(dependencies.results.saveRemoteResult).toHaveBeenCalledTimes(1);
        const second = await controller.sync();
        expect(dependencies.results.saveRemoteResult).toHaveBeenCalledTimes(1);
        // Already opened: the reader does not open again.
        expect(second.openProjectId).toBeNull();
    });
});

describe('MOB-FEAT-021/AC-006 honest failures', () => {
    it('an image whose hash differs is never committed nor acknowledged', async () => {
        const { controller, calls, dependencies } = setup({ imageHash: 'f'.repeat(64) });
        const snapshot = await controller.sync();
        expect(calls).not.toContain('commit');
        expect(calls.some(call => call.endsWith('/ack'))).toBe(false);
        expect(dependencies.temporary.remove).toHaveBeenCalled();
        expect(snapshot).toMatchObject({ active: 1, openProjectId: null, error: 'result-unavailable' });
    });

    it.each([
        ['FAILED', 'failed FAILED'],
        ['RESULT_EXPIRED', 'failed RESULT_EXPIRED'],
    ])('a remote %s fails the page without navigating', async (status, call) => {
        const { controller, calls } = setup({ status });
        const snapshot = await controller.sync();
        expect(calls).toContain(call);
        expect(snapshot.openProjectId).toBeNull();
    });

    it('a job the gateway no longer knows expires the page', async () => {
        const { controller, calls } = setup({ jobStatus: 404 });
        await controller.sync();
        expect(calls).toContain('failed RESULT_EXPIRED');
    });

    it('a network failure keeps everything for the next round', async () => {
        const { controller, dependencies } = setup();
        dependencies.loadCapabilities = jest.fn(async () => {
            throw new Error('network');
        }) as never;
        const offline = createAcquireRemoteResultController(dependencies);
        expect(await offline.sync()).toMatchObject({ active: 1, error: 'network-required' });
        expect(controller).toBeDefined();
    });
});
