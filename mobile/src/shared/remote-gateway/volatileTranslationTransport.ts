import { fetch as expoFetch } from 'expo/fetch';

import { ensureReadableStream } from './webStreams';

const MAX_ORIGINAL_BYTES = 12 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_BYTES = 64 * 1024 * 1024;
const MAX_WIRE_BYTES = 12 + MAX_MANIFEST_BYTES + MAX_IMAGE_BYTES;
const RESPONSE_MAGIC = 0x54565231;
const TIMEOUT_MS = 330_000;
const CONTENT_TYPE = 'application/vnd.toonlira.translation+binary';

export interface VolatileTranslationRequest {
    token: string;
    idempotencyKey: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    widthPx: number;
    heightPx: number;
    sourceLanguage: string;
    targetLanguage: string;
    disclosureVersion: string;
    body: Uint8Array<ArrayBuffer>;
}
/** Framing is verified here; image/manifest hashes and semantic binding still require the domain parser. */
export interface UnverifiedVolatileResponse {
    manifest: Uint8Array<ArrayBuffer>;
    image: Uint8Array<ArrayBuffer>;
    dispose(): void;
}
export class VolatileTranslationTransportError extends Error {
    constructor(
        readonly code: 'invalid-request' | 'invalid-response' | 'ambiguous' | 'aborted' | 'receipt-exists' | 'unauthorized' | 'quota-exceeded',
        readonly diagnostic?: string,
    ) {
        super(code);
    }
}
const invalid = () => new VolatileTranslationTransportError('invalid-response');

class Frames {
    private chunk: Uint8Array = new Uint8Array(0);
    private offset = 0;
    private received = 0;
    constructor(
        private readonly reader: ReadableStreamDefaultReader<Uint8Array>,
        private readonly signal: AbortSignal,
    ) {}
    private read(): Promise<ReadableStreamReadResult<Uint8Array>> {
        return new Promise((resolve, reject) => {
            const abort = () => reject(new VolatileTranslationTransportError('aborted'));
            if (this.signal.aborted) {
                abort();
                return;
            }
            this.signal.addEventListener('abort', abort, { once: true });
            void this.reader
                .read()
                .then(value => {
                    if (this.signal.aborted) value.value?.fill(0);
                    else resolve(value);
                }, reject)
                .finally(() => this.signal.removeEventListener('abort', abort));
        });
    }
    async exact(size: number, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
        if (!Number.isSafeInteger(size) || size < 1 || size > maximum) throw invalid();
        const output = new Uint8Array(size);
        let written = 0;
        try {
            while (written < size) {
                if (this.signal.aborted) throw new VolatileTranslationTransportError('aborted');
                if (this.offset === this.chunk.length) {
                    this.chunk.fill(0);
                    const next = await this.read();
                    if (next.done) throw invalid();
                    if (next.value.length > MAX_WIRE_BYTES - this.received) throw invalid();
                    this.received += next.value.length;
                    this.chunk = next.value;
                    this.offset = 0;
                    if (this.chunk.length === 0) continue;
                }
                const count = Math.min(size - written, this.chunk.length - this.offset);
                output.set(this.chunk.subarray(this.offset, this.offset + count), written);
                written += count;
                this.offset += count;
            }
            return output;
        } catch (error) {
            output.fill(0);
            throw error;
        }
    }
    async integer(): Promise<number> {
        const bytes = await this.exact(4, 4);
        const result = new DataView(bytes.buffer).getUint32(0);
        bytes.fill(0);
        return result;
    }
    async end(): Promise<void> {
        if (this.signal.aborted) throw new VolatileTranslationTransportError('aborted');
        if (this.offset !== this.chunk.length) throw invalid();
        while (true) {
            const next = await this.read();
            if (this.signal.aborted) throw new VolatileTranslationTransportError('aborted');
            if (next.done) return;
            if (next.value.length !== 0) {
                next.value.fill(0);
                throw invalid();
            }
        }
    }
    clear(): void {
        this.chunk.fill(0);
    }
}

export function createVolatileTranslationTransport(origin: string, fetcher: typeof fetch = expoFetch) {
    let base: URL;
    try {
        base = new URL(origin);
        if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error();
    } catch {
        throw new VolatileTranslationTransportError('invalid-request');
    }
    const url = new URL('/v2/page-translations', base).toString();
    return {
        async process(request: VolatileTranslationRequest, external?: AbortSignal): Promise<UnverifiedVolatileResponse> {
            if (external?.aborted) throw new VolatileTranslationTransportError('aborted');
            if (
                !request.token ||
                request.token.length > 512 ||
                !/^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(request.idempotencyKey) ||
                !['image/jpeg', 'image/png', 'image/webp'].includes(request.mimeType) ||
                request.body.byteLength < 1 ||
                request.body.byteLength > MAX_ORIGINAL_BYTES ||
                !Number.isSafeInteger(request.widthPx) ||
                request.widthPx < 1 ||
                request.widthPx > 12_000 ||
                !Number.isSafeInteger(request.heightPx) ||
                request.heightPx < 1 ||
                request.heightPx > 12_000 ||
                request.widthPx * request.heightPx > 80_000_000 ||
                !/^[A-Za-z-]{2,16}$/.test(request.sourceLanguage) ||
                !/^[A-Za-z-]{2,16}$/.test(request.targetLanguage) ||
                !/^volatile-[A-Za-z0-9._-]{1,55}$/.test(request.disclosureVersion)
            )
                throw new VolatileTranslationTransportError('invalid-request');
            const controller = new AbortController();
            const abort = () => controller.abort();
            external?.addEventListener('abort', abort, { once: true });
            const timer = setTimeout(abort, TIMEOUT_MS);
            let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
            let frames: Frames | undefined;
            let manifest: Uint8Array<ArrayBuffer> | undefined;
            let image: Uint8Array<ArrayBuffer> | undefined;
            let transferred = false;
            try {
                ensureReadableStream();
                const response = await fetcher(url, {
                    method: 'POST',
                    redirect: 'error',
                    signal: controller.signal,
                    body: request.body,
                    headers: {
                        Authorization: `Bearer ${request.token}`,
                        'Content-Type': request.mimeType,
                        Accept: CONTENT_TYPE,
                        'Idempotency-Key': request.idempotencyKey,
                        'X-Image-Byte-Size': String(request.body.byteLength),
                        'X-Image-Width': String(request.widthPx),
                        'X-Image-Height': String(request.heightPx),
                        'X-Source-Language': request.sourceLanguage,
                        'X-Target-Language': request.targetLanguage,
                        'X-Disclosure-Version': request.disclosureVersion,
                    },
                });
                reader = response.body?.getReader();
                if (response.url && response.url !== url) throw invalid();
                if (response.status !== 200) {
                    const code = response.headers.get('x-toonlira-error');
                    const ref = response.headers.get('x-toonlira-correlation');
                    const diagnostic =
                        code && /^[a-z][a-z0-9-]{0,63}$/.test(code)
                            ? `${code}${ref && /^[0-9a-f-]{36}$/i.test(ref) ? ` (${ref})` : ''}`
                            : `HTTP ${response.status}`;
                    const kind =
                        response.status === 401
                            ? 'unauthorized'
                            : response.status === 409
                              ? 'receipt-exists'
                              : response.status === 429
                                ? 'quota-exceeded'
                                : 'ambiguous';
                    throw new VolatileTranslationTransportError(kind, diagnostic);
                }
                if (
                    response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== CONTENT_TYPE ||
                    !response.headers
                        .get('cache-control')
                        ?.split(',')
                        .some(value => value.trim().toLowerCase() === 'no-store') ||
                    !reader
                )
                    throw invalid();
                const declared = response.headers.get('content-length');
                if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_WIRE_BYTES)) throw invalid();
                frames = new Frames(reader, controller.signal);
                if ((await frames.integer()) !== RESPONSE_MAGIC) throw invalid();
                manifest = await frames.exact(await frames.integer(), MAX_MANIFEST_BYTES);
                image = await frames.exact(await frames.integer(), MAX_IMAGE_BYTES);
                if (declared !== null && Number(declared) !== 12 + manifest.length + image.length) throw invalid();
                await frames.end();
                transferred = true;
                const result = { manifest, image };
                return {
                    ...result,
                    dispose() {
                        result.manifest.fill(0);
                        result.image.fill(0);
                    },
                };
            } catch (error) {
                if (error instanceof VolatileTranslationTransportError) throw error;
                throw new VolatileTranslationTransportError(controller.signal.aborted ? 'aborted' : 'ambiguous');
            } finally {
                clearTimeout(timer);
                external?.removeEventListener('abort', abort);
                frames?.clear();
                if (!transferred) {
                    manifest?.fill(0);
                    image?.fill(0);
                }
                if (reader && !transferred) void reader.cancel().catch(() => undefined);
                reader?.releaseLock();
            }
        },
    };
}
