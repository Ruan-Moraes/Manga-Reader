import { createHash } from 'node:crypto';

import { type AcquisitionDependencies, createAcquireRemoteTranslationResultController } from '../acquireRemoteTranslationResult';
const PAGE = '10000000-0000-4000-8000-000000000001',
    ATTEMPT = '20000000-0000-4000-8000-000000000001',
    JOB = '30000000-0000-4000-8000-000000000001';
const hash = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
function fixture() {
    const image = new Uint8Array([1, 2, 3]);
    const imageHash = hash(image);
    const manifest = {
        version: '1.0',
        policyVersion: 'clean-box-1.1',
        jobRef: JOB,
        sourceLanguage: 'en',
        targetLanguage: 'pt-BR',
        originalSha256: 'a'.repeat(64),
        ocrSha256: 'b'.repeat(64),
        translationSha256: 'c'.repeat(64),
        image: { mimeType: 'image/webp', byteSize: 3, widthPx: 900, heightPx: 600, sha256: imageHash },
        regions: [],
    };
    const bytes = new TextEncoder().encode(JSON.stringify(manifest));
    const abort = new AbortController();
    const delivery = {
        attemptId: ATTEMPT,
        operationRef: JOB,
        originalSha256: 'a'.repeat(64),
        signal: abort.signal,
        bytes: { manifest: bytes, image, dispose: jest.fn() },
        dispose: jest.fn(() => {
            image.fill(0);
            bytes.fill(0);
        }),
    };
    const attempt = {
        id: ATTEMPT,
        pageId: PAGE,
        status: 'ACCEPTED',
        remoteStatus: 'READY',
        remoteJobRef: JOB,
        volatileReceiptStatus: 'FINISHED',
        gatewayKey: 'test',
        gatewayContractVersion: '2.0',
    };
    let result: unknown = null;
    const events: string[] = [];
    const stage = {
        renderedFilename: 'owned_result',
        promote: jest.fn(async () => {
            events.push('move');
        }),
        validate: jest.fn(async (): Promise<void> => undefined),
        discard: jest.fn(async () => undefined),
        finish: jest.fn(async () => undefined),
    };
    const takeDelivery = jest.fn().mockReturnValueOnce(delivery).mockReturnValue(null);
    const deps = {
        attempts: { getById: jest.fn(async () => attempt), getProjectIdForPage: async () => 'project', failVolatileAttempt: jest.fn(async () => attempt) },
        projects: {
            getById: async () => ({ id: 'project', sourceLanguage: 'en', targetLanguage: 'pt-BR', pages: [{ id: PAGE, widthPx: 900, heightPx: 600 }] }),
        },
        results: {
            getByPage: jest.fn(async () => result),
            invalidate: jest.fn(async () => {
                result = null;
            }),
        },
        writer: {
            commit: jest.fn(async () => {
                events.push('commit');
                result = { pageId: PAGE, attemptId: ATTEMPT, sourceKind: 'REMOTE', renderedFilename: 'owned_result', sha256: imageHash };
                return true;
            }),
            claimAutoOpen: jest.fn(async () => true),
        },
        takeDelivery,
        withFiles: async <T>(work: () => Promise<T>) => work(),
        hashBytes: async (b: Uint8Array) => hash(b),
        originalHash: jest.fn(async () => 'a'.repeat(64)),
        stage: jest.fn(async () => stage),
        validateStored: jest.fn(async () => true),
        now: () => 1000,
    } as unknown as AcquisitionDependencies;
    return { deps, delivery, abort, manifest, attempt, events, stage, takeDelivery, controller: createAcquireRemoteTranslationResultController(deps) };
}
it('consumes the direct response once, validates/moves before commit and restores locally offline', async () => {
    const f = fixture();
    await expect(f.controller.run(ATTEMPT)).resolves.toMatchObject({ status: 'ready', stage: 1, projectId: 'project', empty: true });
    expect(f.events).toEqual(['move', 'commit']);
    expect(f.delivery.dispose).toHaveBeenCalledTimes(1);
    expect(f.delivery.bytes.image.every(n => n === 0)).toBe(true);
    expect(f.delivery.bytes.manifest.every(n => n === 0)).toBe(true);
    await expect(f.controller.run(ATTEMPT)).resolves.toMatchObject({ status: 'ready' });
    expect(f.takeDelivery).toHaveBeenCalledTimes(1);
    expect(f.deps.stage).toHaveBeenCalledTimes(1);
});
it.each(['hash', 'operation', 'original', 'manifest', 'move', 'validate', 'commit'])(
    'never creates READY after %s failure; releases memory and only owned stage',
    async point => {
        const f = fixture();
        if (point === 'hash') f.deps.hashBytes = async () => 'e'.repeat(64);
        if (point === 'operation') f.delivery.operationRef = '90000000-0000-4000-8000-000000000001';
        if (point === 'original') f.deps.originalHash = async () => 'e'.repeat(64);
        if (point === 'manifest') f.delivery.bytes.manifest[0] = 0;
        if (point === 'move') f.stage.promote.mockRejectedValue(new Error('disk'));
        if (point === 'validate') f.stage.validate.mockRejectedValue(new Error('decode'));
        if (point === 'commit') jest.mocked(f.deps.writer.commit).mockRejectedValue(new Error('db'));
        expect((await f.controller.run(ATTEMPT)).status).toBe('failed');
        expect(f.delivery.dispose).toHaveBeenCalledTimes(1);
        expect(f.deps.attempts.failVolatileAttempt).toHaveBeenCalled();
        if (['move', 'validate', 'commit'].includes(point)) expect(f.stage.discard).toHaveBeenCalledTimes(1);
    },
);
it('marks a lost complete response as needing an explicit new execution, without remote recovery', async () => {
    const f = fixture();
    f.takeDelivery.mockReset().mockReturnValue(null);
    await expect(f.controller.run(ATTEMPT)).resolves.toMatchObject({ status: 'failed', error: 'localTranslation.deliveryLost' });
    expect(f.deps.stage).not.toHaveBeenCalled();
    expect(f.deps.attempts.failVolatileAttempt).toHaveBeenCalled();
});
it('rechecks the original after file verification before publication', async () => {
    const f = fixture();
    jest.mocked(f.deps.originalHash).mockResolvedValueOnce('a'.repeat(64)).mockResolvedValueOnce('e'.repeat(64));
    expect((await f.controller.run(ATTEMPT)).status).toBe('failed');
    expect(f.deps.writer.commit).not.toHaveBeenCalled();
    expect(f.stage.discard).toHaveBeenCalledTimes(1);
});
it.each(['before', 'move', 'validation'])('fences a delivery interrupted at %s without publication', async point => {
    const f = fixture();
    if (point === 'before') f.abort.abort();
    if (point === 'move')
        f.stage.promote.mockImplementation(async () => {
            f.abort.abort();
        });
    if (point === 'validation')
        f.stage.validate.mockImplementation(async () => {
            f.abort.abort();
        });
    expect((await f.controller.run(ATTEMPT)).status).toBe('cancelled');
    expect(f.deps.writer.commit).not.toHaveBeenCalled();
    expect(f.delivery.dispose).toHaveBeenCalledTimes(1);
});
it('does not publish after its foreground owner leaves', async () => {
    const f = fixture(),
        owner = new AbortController();
    f.stage.validate.mockImplementation(async () => {
        owner.abort();
    });
    expect((await f.controller.run(ATTEMPT, owner.signal)).status).toBe('cancelled');
    expect(f.deps.writer.commit).not.toHaveBeenCalled();
    expect(f.stage.discard).toHaveBeenCalledTimes(1);
});
it('does not consume auto-open after cancellation', async () => {
    const f = fixture(),
        abort = new AbortController();
    abort.abort();
    expect(await f.controller.claimOpen(PAGE, abort.signal)).toBe(false);
    expect(f.deps.writer.claimAutoOpen).not.toHaveBeenCalled();
});
it('refuses a corrupted stored file without consuming a new delivery', async () => {
    const f = fixture();
    await f.controller.run(ATTEMPT);
    jest.mocked(f.deps.validateStored).mockResolvedValue(false);
    expect((await f.controller.run(ATTEMPT)).error).toBe('localTranslation.invalidRemoteManifest');
    expect(f.takeDelivery).toHaveBeenCalledTimes(1);
});
it('resolves lost COMMIT confirmation against durable truth before cleanup', async () => {
    const f = fixture(),
        write = jest.mocked(f.deps.writer.commit).getMockImplementation()!;
    jest.mocked(f.deps.writer.commit).mockImplementation(async input => {
        await write(input);
        throw new Error('lost confirmation');
    });
    expect((await f.controller.run(ATTEMPT)).status).toBe('ready');
    expect(f.stage.discard).not.toHaveBeenCalled();
    expect(f.deps.attempts.failVolatileAttempt).not.toHaveBeenCalled();
});
it('retains promoted files and attempt when COMMIT and durable resolution are unavailable', async () => {
    const f = fixture(),
        write = jest.mocked(f.deps.writer.commit).getMockImplementation()!;
    jest.mocked(f.deps.writer.commit).mockImplementation(async input => {
        await write(input);
        throw new Error('lost confirmation');
    });
    jest.mocked(f.deps.results.getByPage).mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('db unavailable'));
    expect((await f.controller.run(ATTEMPT)).status).toBe('waiting');
    expect(f.stage.discard).not.toHaveBeenCalled();
    expect(f.deps.attempts.failVolatileAttempt).not.toHaveBeenCalled();
    expect((await f.controller.run(ATTEMPT)).status).toBe('ready');
    expect(f.takeDelivery).toHaveBeenCalledTimes(1);
});
it('does not let a second foreground owner consume or fail an active delivery', async () => {
    const f = fixture();
    let release!: () => void;
    f.stage.validate.mockImplementation(
        () =>
            new Promise<void>(resolve => {
                release = resolve;
            }),
    );
    const first = f.controller.run(ATTEMPT, new AbortController().signal);
    for (let i = 0; i < 50 && !release; i++) await new Promise<void>(resolve => setImmediate(resolve));
    if (!release) throw new Error('acquisition never reached validation');
    const second = f.controller.run(ATTEMPT, new AbortController().signal);
    release();
    expect((await first).status).toBe('ready');
    expect((await second).status).toBe('ready');
    expect(f.takeDelivery).toHaveBeenCalledTimes(1);
    expect(f.deps.attempts.failVolatileAttempt).not.toHaveBeenCalled();
});

it('retries only local resolution if the read after a successful COMMIT is temporarily unavailable', async () => {
    const f = fixture();
    jest.mocked(f.deps.results.getByPage).mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('db read unavailable'));
    expect((await f.controller.run(ATTEMPT)).status).toBe('waiting');
    expect(f.stage.discard).not.toHaveBeenCalled();
    expect(f.deps.attempts.failVolatileAttempt).not.toHaveBeenCalled();
    expect((await f.controller.run(ATTEMPT)).status).toBe('ready');
    expect(f.takeDelivery).toHaveBeenCalledTimes(1);
});

it('announces receipt only after owning the complete response, before local staging', async () => {
    const f = fixture(),
        progress = jest.fn(() => f.events.push('received'));
    await f.controller.run(ATTEMPT, undefined, progress);
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ stage: 0, status: 'waiting', pageId: PAGE }));
    expect(f.events).toEqual(['received', 'move', 'commit']);
    const lost = fixture();
    lost.takeDelivery.mockReset().mockReturnValue(null);
    progress.mockClear();
    expect((await lost.controller.run(ATTEMPT, undefined, progress)).stage).toBe(-1);
    expect(progress).not.toHaveBeenCalled();
});

it('resolves locally for a resumed foreground owner after an aborted owner confirms COMMIT late', async () => {
    const f = fixture(),
        owner = new AbortController(),
        resumed = new AbortController();
    const write = jest.mocked(f.deps.writer.commit).getMockImplementation()!;
    let release!: () => void;
    jest.mocked(f.deps.writer.commit).mockImplementation(async input => {
        await write(input);
        owner.abort();
        await new Promise<void>(resolve => {
            release = resolve;
        });
        return true;
    });
    const first = f.controller.run(ATTEMPT, owner.signal);
    for (let i = 0; i < 50 && !release; i++) await new Promise<void>(resolve => setImmediate(resolve));
    if (!release) throw new Error('COMMIT was not reached');
    const second = f.controller.run(ATTEMPT, resumed.signal);
    release();
    expect((await first).status).toBe('cancelled');
    expect((await second).status).toBe('ready');
    expect(f.deps.writer.commit).toHaveBeenCalledTimes(1);
    expect(f.takeDelivery).toHaveBeenCalledTimes(1);
    expect(f.delivery.dispose).toHaveBeenCalledTimes(1);
    expect(f.deps.attempts.failVolatileAttempt).not.toHaveBeenCalled();
});
it('invalidates only its corrupted durable result before allowing an explicit new execution', async () => {
    const f = fixture();
    await f.controller.run(ATTEMPT);
    jest.mocked(f.deps.validateStored).mockResolvedValue(false);
    expect((await f.controller.run(ATTEMPT)).status).toBe('failed');
    expect(f.deps.results.invalidate).toHaveBeenCalledWith(PAGE, 1000);
    expect(f.deps.attempts.failVolatileAttempt).toHaveBeenCalledTimes(1);
});
it('preserves a durable result while its local file cannot be inspected, then recovers without network', async () => {
    const f = fixture();
    await f.controller.run(ATTEMPT);
    jest.mocked(f.deps.validateStored).mockRejectedValueOnce(new Error('IO unavailable'));
    expect((await f.controller.run(ATTEMPT)).status).toBe('waiting');
    expect(f.deps.results.invalidate).not.toHaveBeenCalled();
    expect(f.deps.attempts.failVolatileAttempt).not.toHaveBeenCalled();
    expect((await f.controller.run(ATTEMPT)).status).toBe('ready');
    expect(f.takeDelivery).toHaveBeenCalledTimes(1);
});
