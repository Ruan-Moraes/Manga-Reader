jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

import { createRemoteGatewayTransport, RemoteGatewayTransportError } from '../remoteGatewayTransport';

function response(body: string, options: { status?: number; url?: string; length?: string } = {}): Response {
    return {
        status: options.status ?? 200,
        url: options.url ?? 'https://gateway.test/v1/capabilities',
        headers: { get: (name: string) => (name.toLowerCase() === 'content-length' ? (options.length ?? null) : null) } as Headers,
        body: {
            getReader: () => {
                let consumed = false;
                return {
                    read: async () => {
                        if (consumed) return { done: true };
                        consumed = true;
                        return { done: false, value: new TextEncoder().encode(body) };
                    },
                    cancel: jest.fn().mockResolvedValue(undefined),
                    releaseLock: jest.fn(),
                };
            },
        },
        text: async () => body,
    } as unknown as Response;
}

describe('MOB-FEAT-017 remote gateway transport', () => {
    it.each(['http://gateway.test', 'https://user:pass@gateway.test', 'https://gateway.test/path', undefined])('rejects unsafe origin %s', origin => {
        expect(() => createRemoteGatewayTransport({ origin })).toThrow(RemoteGatewayTransportError);
    });

    it('sets explicit redirect and authorization policy without logging or exposing a body', async () => {
        const fetcher = jest.fn(async () => response('{"ok":true}')) as unknown as typeof fetch;
        const transport = createRemoteGatewayTransport({ origin: 'https://gateway.test', fetcher });

        await expect(transport.request('/v1/page-jobs/job', { token: 'opaque-token' })).resolves.toMatchObject({ status: 200, body: { ok: true } });

        expect(fetcher).toHaveBeenCalledWith(
            'https://gateway.test/v1/page-jobs/job',
            expect.objectContaining({ redirect: 'error', headers: expect.objectContaining({ Authorization: 'Bearer opaque-token' }) }),
        );
    });

    it('rejects cross-origin redirects, oversized and invalid JSON responses', async () => {
        const redirected = createRemoteGatewayTransport({
            origin: 'https://gateway.test',
            fetcher: jest.fn(async () => response('{}', { url: 'https://evil.test/v1/capabilities' })) as unknown as typeof fetch,
        });
        await expect(redirected.request('/v1/capabilities')).rejects.toMatchObject({ code: 'redirect' });

        const oversized = createRemoteGatewayTransport({
            origin: 'https://gateway.test',
            maxResponseBytes: 2,
            fetcher: jest.fn(async () => response('{}', { length: '3' })) as unknown as typeof fetch,
        });
        await expect(oversized.request('/v1/capabilities')).rejects.toMatchObject({ code: 'response-too-large' });

        const invalid = createRemoteGatewayTransport({
            origin: 'https://gateway.test',
            fetcher: jest.fn(async () => response('not-json')) as unknown as typeof fetch,
        });
        await expect(invalid.request('/v1/capabilities')).rejects.toMatchObject({ code: 'invalid-response' });
    });

    it('enforces timeout and rejects paths outside v1', async () => {
        const never = jest.fn(
            (_input: RequestInfo | URL, init?: RequestInit) =>
                new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
        ) as typeof fetch;
        const transport = createRemoteGatewayTransport({ origin: 'https://gateway.test', timeoutMs: 1, fetcher: never });
        await expect(transport.request('/v1/capabilities')).rejects.toMatchObject({ code: 'timeout' });
        await expect(transport.request('/api/private')).rejects.toMatchObject({ code: 'invalid-origin' });
        await expect(transport.request('/v1/../private')).rejects.toMatchObject({ code: 'invalid-origin' });
    });
});

describe('MOB-PERF-004 bounded response consumption', () => {
    function streamed(chunks: Uint8Array[], length?: string) {
        const pending = [...chunks];
        const reader = {
            read: jest.fn(async () => (pending.length ? { done: false, value: pending.shift()! } : { done: true })),
            cancel: jest.fn().mockResolvedValue(undefined),
            releaseLock: jest.fn(),
        };
        const value = {
            ...response('', { length }),
            body: { getReader: () => reader },
            text: jest.fn(async () => 'should not read entire body'),
        } as unknown as Response;
        const fetcher = jest.fn(async () => value) as unknown as typeof fetch;
        return { reader, value, fetcher };
    }

    it.each([undefined, '1'])('stops at the first excess chunk with declared length %s', length => {
        const fixture = streamed([new Uint8Array(4), new Uint8Array(4), new Uint8Array(4)], length);
        const transport = createRemoteGatewayTransport({ origin: 'https://gateway.test', maxResponseBytes: 6, fetcher: fixture.fetcher });
        return expect(transport.request('/v1/capabilities'))
            .rejects.toMatchObject({ code: 'response-too-large' })
            .then(() => {
                expect(fixture.reader.read).toHaveBeenCalledTimes(2);
                expect(fixture.reader.cancel).toHaveBeenCalledTimes(1);
                expect(fixture.reader.releaseLock).toHaveBeenCalledTimes(1);
                expect(fixture.value.text).not.toHaveBeenCalled();
            });
    });

    it('decodes multibyte JSON across chunks at the exact byte limit', async () => {
        const bytes = new TextEncoder().encode('{"value":"á😀"}');
        const fixture = streamed([...bytes].map(byte => new Uint8Array([byte])));
        const transport = createRemoteGatewayTransport({ origin: 'https://gateway.test', maxResponseBytes: bytes.length, fetcher: fixture.fetcher });
        await expect(transport.request('/v1/capabilities')).resolves.toMatchObject({ body: { value: 'á😀' } });
        expect(fixture.reader.releaseLock).toHaveBeenCalledTimes(1);
    });

    it('cancels a body rejected by its declared length without reading', async () => {
        const fixture = streamed([new Uint8Array(8)], '8');
        const transport = createRemoteGatewayTransport({ origin: 'https://gateway.test', maxResponseBytes: 6, fetcher: fixture.fetcher });
        await expect(transport.request('/v1/capabilities')).rejects.toMatchObject({ code: 'response-too-large' });
        expect(fixture.reader.read).not.toHaveBeenCalled();
        expect(fixture.reader.cancel).toHaveBeenCalledTimes(1);
    });
});

describe('MOB-PERF-004 stream lifecycle', () => {
    it.each(['timeout', 'external'] as const)('releases a body read interrupted by %s', reason => {
        const external = new AbortController();
        const cancel = jest.fn().mockResolvedValue(undefined);
        const releaseLock = jest.fn();
        const fetcher = jest.fn(async (_url: RequestInfo | URL, init?: RequestInit) => ({
            ...response(''),
            body: {
                getReader: () => ({
                    read: () =>
                        new Promise((_resolve, reject) => {
                            if (init?.signal?.aborted) reject(new Error('aborted'));
                            else init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
                        }),
                    cancel,
                    releaseLock,
                }),
            },
        })) as unknown as typeof fetch;
        const transport = createRemoteGatewayTransport({ origin: 'https://gateway.test', fetcher, timeoutMs: reason === 'timeout' ? 1 : 1000 });
        const operation = transport.request('/v1/capabilities', { signal: external.signal });
        if (reason === 'external') external.abort();
        return expect(operation)
            .rejects.toMatchObject({ code: reason === 'timeout' ? 'timeout' : 'network' })
            .then(() => {
                expect(cancel).toHaveBeenCalledTimes(1);
                expect(releaseLock).toHaveBeenCalledTimes(1);
            });
    });

    it('uses the installed Expo streaming transport by default', async () => {
        const nativeFetch = jest.requireMock('expo/fetch').fetch;
        nativeFetch.mockResolvedValueOnce(response('{}'));
        await expect(createRemoteGatewayTransport({ origin: 'https://gateway.test' }).request('/v1/capabilities')).resolves.toMatchObject({ body: {} });
        expect(nativeFetch).toHaveBeenCalledTimes(1);
    });

    it('accepts a bodyless response without creating a text buffer', async () => {
        const fetcher = jest.fn(async () => ({ ...response('', { status: 204 }), body: null })) as unknown as typeof fetch;
        await expect(createRemoteGatewayTransport({ origin: 'https://gateway.test', fetcher }).request('/v1/capabilities')).resolves.toMatchObject({
            status: 204,
            body: null,
        });
    });
});
