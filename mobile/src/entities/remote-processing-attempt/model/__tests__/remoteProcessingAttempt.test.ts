import { pageJobEnvelopeSchema } from '../remoteProcessingAttempt';

const envelope = {
    contractVersion: '1.0',
    jobRef: '550e8400-e29b-41d4-a716-446655440003',
    status: 'FAILED',
    serverTime: '2026-10-03T12:00:00.000Z',
};

describe('worker failure envelopes', () => {
    it.each([
        'ocr-invalid-media',
        'ocr-invalid-response',
        'ocr-unavailable',
        'translation-invalid-request',
        'translation-invalid-response',
        'translation-unavailable',
    ])('accepts the published sanitized code %s', code => {
        expect(pageJobEnvelopeSchema.safeParse({ ...envelope, error: { code, retryable: false } }).success).toBe(true);
    });

    it.each([
        { code: 'provider-raw-error' },
        { code: 'translation-unavailable', message: 'private provider text' },
        { code: 'ocr-unavailable', rawResponse: { text: 'private OCR text' } },
    ])('rejects unknown codes or sensitive additional fields', error => {
        expect(pageJobEnvelopeSchema.safeParse({ ...envelope, error }).success).toBe(false);
    });

    it('keeps the envelope strict', () => {
        expect(pageJobEnvelopeSchema.safeParse({ ...envelope, text: 'private OCR text' }).success).toBe(false);
        expect(pageJobEnvelopeSchema.safeParse({ ...envelope, error: { code: 'dispatch-unavailable' } }).success).toBe(true);
    });
});

const result = {
    manifestVersion: '1.0',
    widthPx: 100,
    heightPx: 200,
    expiresAt: '2026-10-03T13:00:00.000Z',
    image: {
        url: 'https://storage.googleapis.com/test/private/rendering/image.webp?signature=synthetic',
        mimeType: 'image/webp',
        byteSize: 1024,
        sha256: 'a'.repeat(64),
        expiresAt: '2026-10-03T12:05:00.000Z',
    },
    manifest: {
        url: 'https://storage.googleapis.com/test/private/rendering/manifest.json?signature=synthetic',
        mimeType: 'application/json',
        byteSize: 2048,
        sha256: 'b'.repeat(64),
        expiresAt: '2026-10-03T12:05:00.000Z',
    },
};
const ready = { ...envelope, status: 'READY', error: null, result };

describe('private ready result contract', () => {
    it('accepts complete metadata without downloading or promoting a local result', () => {
        expect(pageJobEnvelopeSchema.parse(ready).result).toEqual(result);
        // Mutation replay may omit downloads; the later acquisition must use GET.
        expect(pageJobEnvelopeSchema.safeParse({ ...envelope, status: 'READY' }).success).toBe(true);
    });

    it.each(['QUEUED', 'OCR', 'TRANSLATING', 'RENDERING', 'FAILED', 'CANCEL_PENDING', 'CANCELLED', 'RESULT_EXPIRED'])(
        'rejects result attached to %s',
        status => {
            expect(pageJobEnvelopeSchema.safeParse({ ...ready, status }).success).toBe(false);
        },
    );

    it.each([
        { ...result, image: undefined },
        { ...result, manifest: undefined },
        { ...result, widthPx: 0 },
        { ...result, widthPx: 12001 },
        { ...result, widthPx: 12000, heightPx: 12000 },
        { ...result, manifestVersion: '2.0' },
        { ...result, text: 'private text' },
        { ...result, image: { ...result.image, mimeType: 'image/png' } },
        { ...result, image: { ...result.image, byteSize: 64 * 1024 * 1024 + 1 } },
        { ...result, manifest: { ...result.manifest, byteSize: 4 * 1024 * 1024 + 1 } },
        { ...result, image: { ...result.image, sha256: 'invalid' } },
        { ...result, image: { ...result.image, objectKey: 'private/rendering/image' } },
        { ...result, image: { ...result.image, expiresAt: envelope.serverTime } },
        { ...result, image: { ...result.image, expiresAt: '2026-10-03T12:05:01.000Z' } },
        { ...result, expiresAt: '2026-10-03T12:01:00.000Z' },
        { ...result, expiresAt: '2026-10-03T13:00:01.000Z' },
    ])('rejects inconsistent or unbounded metadata %#', invalid => {
        expect(pageJobEnvelopeSchema.safeParse({ ...ready, result: invalid }).success).toBe(false);
    });

    it.each([
        'http://storage.googleapis.com/test?signature=x',
        'https://untrusted.test/test?signature=x',
        'https://user:secret@storage.googleapis.com/test?signature=x',
        'https://storage.googleapis.com:444/test?signature=x',
        'https://storage.googleapis.com/test?signature=x#fragment',
        'https://storage.googleapis.com/test',
        `https://storage.googleapis.com/test?signature=${'x'.repeat(8192)}`,
    ])('rejects an unsafe bearer URL %#', url => {
        expect(pageJobEnvelopeSchema.safeParse({ ...ready, result: { ...result, image: { ...result.image, url } } }).success).toBe(false);
    });

    it('rejects an error paired with an available result', () => {
        expect(pageJobEnvelopeSchema.safeParse({ ...ready, error: { code: 'storage-unavailable' } }).success).toBe(false);
    });
});
