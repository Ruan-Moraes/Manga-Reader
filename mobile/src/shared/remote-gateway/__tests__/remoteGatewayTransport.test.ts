import { createRemoteGatewayTransport, RemoteGatewayTransportError } from '../remoteGatewayTransport';

function response(body: string, options: { status?: number; url?: string; length?: string } = {}): Response {
    return {
        status: options.status ?? 200,
        url: options.url ?? 'https://gateway.test/v1/capabilities',
        headers: { get: (name: string) => (name.toLowerCase() === 'content-length' ? (options.length ?? null) : null) } as Headers,
        text: async () => body,
    } as Response;
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
