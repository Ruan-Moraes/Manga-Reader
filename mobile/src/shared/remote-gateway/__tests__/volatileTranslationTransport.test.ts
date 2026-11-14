import { createVolatileTranslationTransport } from '../volatileTranslationTransport';

const origin = 'https://gateway.example.test';
const command = {
    token: 'opaque-session-token-with-at-least-32-characters',
    idempotencyKey: '00000000-0000-7000-8000-000000000001',
    mimeType: 'image/png' as const,
    widthPx: 32,
    heightPx: 16,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    disclosureVersion: 'volatile-1',
    body: new Uint8Array([1, 2, 3]),
};
function wire(manifest = new Uint8Array([123, 125]), image = new Uint8Array([1, 2, 3])) {
    const bytes = new Uint8Array(12 + manifest.length + image.length);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x54565231);
    view.setUint32(4, manifest.length);
    bytes.set(manifest, 8);
    view.setUint32(8 + manifest.length, image.length);
    bytes.set(image, 12 + manifest.length);
    return bytes;
}
function response(chunks: Uint8Array[], options: { status?: number; url?: string; contentType?: string } = {}) {
    const cancel = jest.fn(async () => undefined);
    let offset = 0;
    return {
        response: {
            status: options.status ?? 200,
            url: options.url ?? `${origin}/v2/page-translations`,
            headers: new Headers({ 'content-type': options.contentType ?? 'application/vnd.toonlira.translation+binary', 'cache-control': 'no-store' }),
            body: {
                getReader: () => ({
                    read: async () => (offset < chunks.length ? { done: false, value: chunks[offset++] } : { done: true }),
                    cancel,
                    releaseLock: jest.fn(),
                }),
            },
        } as unknown as Response,
        cancel,
    };
}
it('sends one raw authenticated request and reads frames across arbitrary chunk boundaries', async () => {
    const bytes = wire();
    const fixture = response(Array.from(bytes, byte => new Uint8Array([byte])));
    const fetcher = jest.fn(async () => fixture.response);
    const result = await createVolatileTranslationTransport(origin, fetcher as typeof fetch).process(command);
    expect(result.manifest).toEqual(new Uint8Array([123, 125]));
    expect(result.image).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]).toEqual([
        `${origin}/v2/page-translations`,
        expect.objectContaining({
            body: command.body,
            redirect: 'error',
            headers: expect.objectContaining({ Authorization: `Bearer ${command.token}`, 'Content-Type': 'image/png' }),
        }),
    ]);
    result.dispose();
    expect(result.image.every(byte => byte === 0)).toBe(true);
    expect(result.manifest.every(byte => byte === 0)).toBe(true);
});
it.each(['truncated', 'trailing', 'oversized', 'wrong-magic'])('rejects %s without exposing a partial result', async kind => {
    let bytes = wire();
    if (kind === 'truncated') bytes = bytes.slice(0, -1);
    if (kind === 'trailing') bytes = new Uint8Array([...bytes, 0]);
    if (kind === 'oversized') new DataView(bytes.buffer).setUint32(4, 0x7fffffff);
    if (kind === 'wrong-magic') bytes[0] = 0;
    const fixture = response([bytes]);
    await expect(createVolatileTranslationTransport(origin, (async () => fixture.response) as typeof fetch).process(command)).rejects.toThrow(
        'invalid-response',
    );
    expect(fixture.cancel).toHaveBeenCalledTimes(1);
});
it('does not retry ambiguous failures, refuses redirects and honors abort before sending', async () => {
    const failed = jest.fn(async () => {
        throw new Error('sensitive-network-detail');
    });
    await expect(createVolatileTranslationTransport(origin, failed as typeof fetch).process(command)).rejects.toThrow('ambiguous');
    expect(failed).toHaveBeenCalledTimes(1);
    const fixture = response([wire()], { url: 'https://unexpected.example.test/v2/page-translations' });
    await expect(createVolatileTranslationTransport(origin, (async () => fixture.response) as typeof fetch).process(command)).rejects.toThrow(
        'invalid-response',
    );
    const aborted = new AbortController();
    aborted.abort();
    const fetcher = jest.fn();
    await expect(createVolatileTranslationTransport(origin, fetcher).process(command, aborted.signal)).rejects.toThrow('aborted');
    expect(fetcher).not.toHaveBeenCalled();
});
it('reports HTTP 429 as an explicit quota refusal and never retries it', async () => {
    const fixture = response([], { status: 429 });
    const fetcher = jest.fn(async () => fixture.response);
    await expect(createVolatileTranslationTransport(origin, fetcher as typeof fetch).process(command)).rejects.toThrow('quota-exceeded');
    expect(fetcher).toHaveBeenCalledTimes(1);
});
it('retains only a bounded gateway error code and correlation reference without retrying', async () => {
    const fixture = response([], { status: 503 });
    fixture.response.headers.set('x-toonlira-error', 'ocr-unavailable');
    fixture.response.headers.set('x-toonlira-correlation', '12345678-1234-1234-1234-123456789abc');
    const fetcher = jest.fn(async () => fixture.response);
    await expect(createVolatileTranslationTransport(origin, fetcher as typeof fetch).process(command)).rejects.toMatchObject({
        code: 'ambiguous',
        diagnostic: 'ocr-unavailable (12345678-1234-1234-1234-123456789abc)',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
});
it('aborts an uncooperative final read without waiting for cancel or exposing the completed frames', async () => {
    const bytes = wire();
    let reached!: () => void;
    const atEnd = new Promise<void>(resolve => {
        reached = resolve;
    });
    let calls = 0;
    const cancel = jest.fn(() => new Promise<void>(() => undefined));
    const read = jest.fn(async () => {
        if (calls++ === 0) return { done: false, value: bytes };
        reached();
        return new Promise<never>(() => undefined);
    });
    const fixture = response([]);
    fixture.response.body!.getReader = () => ({ read, cancel, releaseLock: jest.fn() }) as never;
    const abort = new AbortController();
    const pending = createVolatileTranslationTransport(origin, (async () => fixture.response) as typeof fetch).process(command, abort.signal);
    const rejected = expect(pending).rejects.toThrow('aborted');
    await atEnd;
    abort.abort();
    await rejected;
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(bytes.every(value => value === 0)).toBe(true);
});
it('accepts empty stream chunks while still requiring EOF after the declared frames', async () => {
    const fixture = response([new Uint8Array(), wire(), new Uint8Array()]);
    const result = await createVolatileTranslationTransport(origin, (async () => fixture.response) as typeof fetch).process(command);
    expect(result.image).toEqual(new Uint8Array([1, 2, 3]));
    result.dispose();
});
