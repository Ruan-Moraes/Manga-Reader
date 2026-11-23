import type { RemoteGatewayTransport } from '@/shared/remote-gateway';

import { createRemoteProcessingIdentity } from '../remoteProcessingIdentity';

describe('MOB-FEAT-017 anonymous gateway identity', () => {
    it('stores only the long installation credential and keeps the short bearer in memory', async () => {
        const values = new Map<string, string>();

        const storage = {
            getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
            setItemAsync: jest.fn(async (key: string, value: string) => void values.set(key, value)),
            deleteItemAsync: jest.fn(async (key: string) => void values.delete(key)),
        };

        const request = jest
            .fn()
            .mockResolvedValueOnce({
                status: 201,
                headers: {},
                body: {
                    contractVersion: '1.0',
                    installationRef: '550e8400-e29b-41d4-a716-446655440000',
                    credential: 'c'.repeat(43),
                    createdAt: '2026-09-02T12:00:00.000Z',
                },
            })
            .mockResolvedValueOnce({
                status: 201,
                headers: {},
                body: { contractVersion: '1.0', accessToken: 's'.repeat(43), expiresAt: '2099-09-02T12:15:00.000Z' },
            });

        const transport = { request, upload: jest.fn() } as unknown as RemoteGatewayTransport;

        const identity = createRemoteProcessingIdentity(storage);

        const first = await identity.getSession('gateway-alpha', transport);
        const second = await identity.getSession('gateway-alpha', transport);

        expect(first).toEqual(second);
        expect(request).toHaveBeenCalledTimes(2);
        expect(request).toHaveBeenNthCalledWith(
            2,
            '/v1/anonymous/sessions',
            expect.objectContaining({ token: 'c'.repeat(43), body: { installationRef: '550e8400-e29b-41d4-a716-446655440000' } }),
        );
        expect([...values.values()].join(' ')).toContain('c'.repeat(43));
        expect([...values.values()].join(' ')).not.toContain('s'.repeat(43));
    });
});

function fixtureTransport(bearer: string, credential: string) {
    return {
        request: jest.fn(async (path: string) => ({
            status: 201,
            headers: {},
            body: path.endsWith('/installations')
                ? { contractVersion: '1.0', installationRef: '550e8400-e29b-41d4-a716-446655440000', credential, createdAt: '2026-09-02T12:00:00.000Z' }
                : { contractVersion: '1.0', accessToken: bearer, expiresAt: '2099-09-02T12:15:00.000Z' },
        })),
        upload: jest.fn(),
    } as unknown as RemoteGatewayTransport;
}
function fixtureStorage() {
    const values = new Map<string, string>();
    return {
        values,
        getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
        setItemAsync: jest.fn(async (key: string, value: string) => void values.set(key, value)),
        deleteItemAsync: jest.fn(async (key: string) => void values.delete(key)),
    };
}
it('never sends a bearer or installation credential from another gateway', async () => {
    const storage = fixtureStorage();
    const identity = createRemoteProcessingIdentity(storage);
    const alpha = fixtureTransport('a'.repeat(43), 'c'.repeat(43));
    const beta = fixtureTransport('b'.repeat(43), 'd'.repeat(43));
    await identity.getSession('alpha', alpha);
    expect((await identity.getSession('beta', beta)).accessToken).toBe('b'.repeat(43));
    expect(beta.request).toHaveBeenCalledTimes(2);
    expect(beta.request).toHaveBeenNthCalledWith(2, '/v1/anonymous/sessions', expect.objectContaining({ token: 'd'.repeat(43) }));
});
it('clearing data prevents a late registration from recreating credentials or a bearer', async () => {
    const storage = fixtureStorage();
    const identity = createRemoteProcessingIdentity(storage);
    let finish!: (value: Awaited<ReturnType<RemoteGatewayTransport['request']>>) => void;
    const pending = new Promise<Awaited<ReturnType<RemoteGatewayTransport['request']>>>(resolve => {
        finish = resolve;
    });
    const alpha = fixtureTransport('a'.repeat(43), 'c'.repeat(43));
    (alpha.request as jest.Mock).mockReturnValueOnce(pending);
    const request = identity.getSession('alpha', alpha);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await identity.clear();
    finish({
        status: 201,
        headers: new Headers(),
        body: {
            contractVersion: '1.0',
            installationRef: '550e8400-e29b-41d4-a716-446655440000',
            credential: 'c'.repeat(43),
            createdAt: '2026-09-02T12:00:00.000Z',
        },
    });
    await expect(request).rejects.toThrow('capabilities-unavailable');
    expect(storage.values.size).toBe(0);
    expect(alpha.request).toHaveBeenCalledTimes(1);
    expect((await identity.getSession('alpha', alpha)).accessToken).toBe('a'.repeat(43));
    expect(alpha.request).toHaveBeenCalledTimes(3);
});

it('shares the same installation and bearer during concurrent bootstrap', async () => {
    const storage = fixtureStorage();
    const identity = createRemoteProcessingIdentity(storage);
    const transport = fixtureTransport('a'.repeat(43), 'c'.repeat(43));
    const [first, second] = await Promise.all([identity.getSession('alpha', transport), identity.getSession('alpha', transport)]);
    expect(first).toEqual(second);
    expect(transport.request).toHaveBeenCalledTimes(2);
    expect(storage.setItemAsync).toHaveBeenCalledTimes(1);
});
it('aborting one waiter does not cancel a concurrent caller sharing authentication', async () => {
    const storage = fixtureStorage();
    const identity = createRemoteProcessingIdentity(storage);
    const transport = fixtureTransport('a'.repeat(43), 'c'.repeat(43));
    const firstAbort = new AbortController();
    const secondAbort = new AbortController();
    const first = identity.getSession('alpha', transport, firstAbort.signal);
    const second = identity.getSession('alpha', transport, secondAbort.signal);
    firstAbort.abort();
    await expect(first).rejects.toThrow('capabilities-unavailable');
    expect((await second).accessToken).toBe('a'.repeat(43));
    expect(transport.request).toHaveBeenCalledTimes(2);
    await expect(identity.getSession('alpha', transport, firstAbort.signal)).rejects.toThrow('capabilities-unavailable');
});
it('clear removes a credential whose SecureStore write was already in progress', async () => {
    const storage = fixtureStorage();
    const identity = createRemoteProcessingIdentity(storage);
    const transport = fixtureTransport('a'.repeat(43), 'c'.repeat(43));
    let entered!: () => void;
    let release!: () => void;
    const writing = new Promise<void>(resolve => {
        entered = resolve;
    });
    const resume = new Promise<void>(resolve => {
        release = resolve;
    });
    storage.setItemAsync.mockImplementationOnce(async (key, value) => {
        entered();
        await resume;
        storage.values.set(key, value);
    });
    const outcome = identity.getSession('alpha', transport).then(
        () => 'unexpected-success',
        () => 'rejected',
    );
    await writing;
    const clearing = identity.clear();
    release();
    await clearing;
    expect(await outcome).toBe('rejected');
    expect(storage.values.size).toBe(0);
    expect((await identity.getSession('alpha', transport)).accessToken).toBe('a'.repeat(43));
    expect(transport.request).toHaveBeenCalledTimes(3);
});

it('invalidates even a cached bearer whose caller has not received it when clear begins', async () => {
    const identity = createRemoteProcessingIdentity(fixtureStorage());
    const transport = fixtureTransport('a'.repeat(43), 'c'.repeat(43));
    await identity.getSession('alpha', transport);
    const outcome = identity.getSession('alpha', transport).then(
        () => 'unexpected-success',
        () => 'rejected',
    );
    await identity.clear();
    expect(await outcome).toBe('rejected');
});
