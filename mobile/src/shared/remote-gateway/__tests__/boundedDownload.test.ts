import { downloadPrivateBytes } from '../../../../test-support/pre-volatile/legacyBoundedDownload';

function response(bytes: number[], options: { status?: number; url?: string; mime?: string } = {}) {
    const cancel = jest.fn(async () => undefined);
    let sent = false;
    return {
        status: options.status ?? 200,
        url: options.url ?? 'https://storage.googleapis.com/bucket/a?signature=x',
        headers: new Headers({ 'content-type': options.mime ?? 'image/webp' }),
        body: {
            getReader: () => ({
                read: async () => (sent ? { done: true } : ((sent = true), { done: false, value: new Uint8Array(bytes) })),
                cancel,
                releaseLock: jest.fn(),
            }),
        },
    } as unknown as Response;
}
const request = { url: 'https://storage.googleapis.com/bucket/a?signature=x', byteSize: 3, mimeType: 'image/webp' };
it('uses no gateway credentials, refuses redirects and reads exact bounded bytes', async () => {
    const fetcher = jest.fn(async (_url: string | URL | Request, _init?: RequestInit) => response([1, 2, 3]));
    expect(await downloadPrivateBytes(request, undefined, fetcher as typeof fetch)).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ redirect: 'error' });
    expect(fetcher.mock.calls[0]?.[1]).not.toHaveProperty('headers.Authorization');
});
it.each([
    [1, 2],
    [1, 2, 3, 4],
])('rejects truncated and oversized bodies %s', async (...bytes) => {
    await expect(downloadPrivateBytes(request, undefined, (async () => response(bytes)) as typeof fetch)).rejects.toThrow(
        'localTranslation.downloadUnavailable',
    );
});
it.each([{ status: 302 }, { mime: 'text/html' }, { url: 'https://evil.example/a' }])('rejects status, MIME and effective redirect %j', async options => {
    await expect(downloadPrivateBytes(request, undefined, (async () => response([1, 2, 3], options)) as typeof fetch)).rejects.toThrow(
        'localTranslation.downloadUnavailable',
    );
});
it('rejects unexpected URLs before network activity and honors cancellation', async () => {
    const fetcher = jest.fn();
    await expect(downloadPrivateBytes({ ...request, url: 'http://storage.googleapis.com/a?x=1' }, undefined, fetcher)).rejects.toThrow();
    const abort = new AbortController();
    abort.abort();
    await expect(downloadPrivateBytes(request, abort.signal, fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
});

it('supports the native Expo response stream when the runtime has no ReadableStream global', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'ReadableStream');
    Object.defineProperty(globalThis, 'ReadableStream', { configurable: true, writable: true, value: undefined });
    try {
        const fetcher = async () =>
            ({
                status: 200,
                url: request.url,
                headers: new Headers({ 'content-type': 'image/webp' }),
                get body() {
                    return new ReadableStream<Uint8Array>({
                        start(controller) {
                            controller.enqueue(new Uint8Array([1, 2, 3]));
                            controller.close();
                        },
                    });
                },
            }) as Response;
        await expect(downloadPrivateBytes(request, undefined, fetcher as typeof fetch)).resolves.toEqual(new Uint8Array([1, 2, 3]));
    } finally {
        if (descriptor) Object.defineProperty(globalThis, 'ReadableStream', descriptor);
        else Reflect.deleteProperty(globalThis, 'ReadableStream');
    }
});
