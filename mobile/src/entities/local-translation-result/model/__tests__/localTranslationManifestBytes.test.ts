jest.mock('expo-crypto', () => ({ CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digest: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.unmock('expo/src/winter/TextDecoder');

import { TextDecoder as ExpoTextDecoder } from 'expo/src/winter/TextDecoder';
import { digest } from 'expo-crypto';
import { File } from 'expo-file-system';
import { createHash } from 'node:crypto';

import { type LocalTranslationManifestExpectation, parseLocalTranslationManifestBytes } from '../localTranslationManifest';

const MAX_BYTES = 4 * 1024 * 1024;
const JOB = '550e8400-e29b-41d4-a716-446655440001';
const REGION = '550e8400-e29b-41d4-a716-446655440002';
const TEXT = '  e\u0301\r\n漢字 😀 <script>literal</script>  ';
const INVALID = 'localTranslation.invalidRemoteManifest';

function expected(): LocalTranslationManifestExpectation {
    return {
        jobRef: JOB,
        sourceLanguage: 'zh-Hans',
        targetLanguage: 'zh-Hant',
        ocrManifestSha256: 'a'.repeat(64),
        regions: [{ id: REGION, readingOrder: 0 }],
    };
}

function fixture() {
    return { ...expected(), version: '1.0', model: 'general/translation-llm', regions: [{ id: REGION, readingOrder: 0, translatedText: TEXT }] };
}

function encoded(value: unknown): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(value));
}

function hash(bytes: Uint8Array): string {
    return createHash('sha256').update(bytes).digest('hex');
}

function nativeDigest(bytes: Uint8Array): ArrayBuffer {
    return new Uint8Array(createHash('sha256').update(bytes).digest()).buffer;
}

beforeEach(() => {
    jest.mocked(digest).mockImplementation(async (_algorithm, bytes) => nativeDigest(bytes as Uint8Array));
});

describe('MOB-FEAT-019/AC-003/004 translation manifest byte integrity', () => {
    it('hashes exact bytes and preserves Unicode, whitespace, markup and the Chinese variants', async () => {
        const bytes = encoded(fixture());
        const manifest = await parseLocalTranslationManifestBytes(bytes, hash(bytes), expected());
        expect(manifest.regions[0]?.translatedText).toBe(TEXT);
        expect(manifest.sourceLanguage).toBe('zh-Hans');
        expect(manifest.targetLanguage).toBe('zh-Hant');
        expect(digest).toHaveBeenCalledTimes(1);
        expect(File).not.toHaveBeenCalled();
    });

    it('preserves ID association and reconstructs only the OCR sequence', async () => {
        const second = { id: '550e8400-e29b-41d4-a716-446655440003', readingOrder: 1 };
        const reference = { ...expected(), regions: [...expected().regions, second] };
        const bytes = encoded({ ...fixture(), regions: [{ ...second, translatedText: 'segundo' }, ...fixture().regions] });
        const manifest = await parseLocalTranslationManifestBytes(bytes, hash(bytes), reference);
        expect(manifest.regions.map(region => region.id)).toEqual(reference.regions.map(region => region.id));
        expect(manifest.regions[0]?.translatedText).toBe(TEXT);
    });

    it('accepts an empty page without synthesizing text', async () => {
        const bytes = encoded({ ...fixture(), regions: [] });
        await expect(parseLocalTranslationManifestBytes(bytes, hash(bytes), { ...expected(), regions: [] })).resolves.toMatchObject({ regions: [] });
    });

    it('uses the installed Expo UTF-8 decoder without silently replacing malformed bytes', async () => {
        const previous = global.TextDecoder;
        global.TextDecoder = ExpoTextDecoder as unknown as typeof TextDecoder;
        try {
            const bytes = encoded(fixture());
            await expect(parseLocalTranslationManifestBytes(bytes, hash(bytes), expected())).resolves.toMatchObject({ regions: [{ translatedText: TEXT }] });
            const invalidBytes = new Uint8Array([0x22, 0xc0, 0x80, 0x22]);
            const parse = jest.spyOn(JSON, 'parse');
            await expect(parseLocalTranslationManifestBytes(invalidBytes, hash(invalidBytes), expected())).rejects.toThrow(INVALID);
            expect(parse).not.toHaveBeenCalled();
        } finally {
            global.TextDecoder = previous;
        }
    });

    it('includes a UTF-8 BOM in the hash even when the decoder omits it from JSON', async () => {
        const bytes = encoded(fixture());
        const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes]);
        await expect(parseLocalTranslationManifestBytes(withBom, hash(withBom), expected())).resolves.toMatchObject({ regions: [{ translatedText: TEXT }] });
        await expect(parseLocalTranslationManifestBytes(withBom, hash(bytes), expected())).rejects.toThrow(INVALID);
    });

    it('rejects a changed byte even when it does not change the parsed JSON', async () => {
        const bytes = encoded(fixture());
        const changed = new Uint8Array([...bytes, 0x20]);
        const parse = jest.spyOn(JSON, 'parse');
        await expect(parseLocalTranslationManifestBytes(changed, hash(bytes), expected())).rejects.toThrow(INVALID);
        expect(parse).not.toHaveBeenCalled();
    });

    it('hashes and decodes only the supplied subarray, not its surrounding buffer', async () => {
        const bytes = encoded(fixture());
        const buffer = new Uint8Array([0xff, ...bytes, 0xff]);
        const view = buffer.subarray(1, buffer.length - 1);
        await expect(parseLocalTranslationManifestBytes(view, hash(bytes), expected())).resolves.toMatchObject({ regions: [{ translatedText: TEXT }] });
    });

    it.each([null, undefined, 'private-text', {}, new ArrayBuffer(2), new DataView(new ArrayBuffer(2))])(
        'rejects a non-byte input before hashing',
        async value => {
            await expect(parseLocalTranslationManifestBytes(value as Uint8Array, 'a'.repeat(64), expected())).rejects.toThrow(INVALID);
            expect(digest).not.toHaveBeenCalled();
        },
    );

    it.each([null, undefined, '', 'A'.repeat(64), 'g'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)])(
        'rejects a malformed expected hash before hashing',
        async value => {
            await expect(parseLocalTranslationManifestBytes(encoded(fixture()), value as string, expected())).rejects.toThrow(INVALID);
            expect(digest).not.toHaveBeenCalled();
        },
    );

    it.each([null, { ...expected(), jobRef: 'invalid' }, { ...expected(), targetLanguage: 'zh-Hans' }, { ...expected(), regions: null }])(
        'rejects an invalid reference before hashing',
        async reference => {
            const bytes = encoded(fixture());
            await expect(parseLocalTranslationManifestBytes(bytes, hash(bytes), reference as LocalTranslationManifestExpectation)).rejects.toThrow(INVALID);
            expect(digest).not.toHaveBeenCalled();
        },
    );

    it('enforces the existing gateway byte limit exactly, independently of text limits', async () => {
        const bytes = new Uint8Array(MAX_BYTES).fill(0x20);
        bytes.set(encoded({ ...fixture(), regions: [] }));
        const reference = { ...expected(), regions: [] };
        await expect(parseLocalTranslationManifestBytes(bytes, hash(bytes), reference)).resolves.toMatchObject({ regions: [] });
        jest.mocked(digest).mockClear();
        await expect(parseLocalTranslationManifestBytes(new Uint8Array(MAX_BYTES + 1), 'a'.repeat(64), reference)).rejects.toThrow(INVALID);
        await expect(parseLocalTranslationManifestBytes(new Uint8Array(), 'a'.repeat(64), reference)).rejects.toThrow(INVALID);
        expect(digest).not.toHaveBeenCalled();
    });

    it.each([[0x80], [0xc0, 0x80], [0xe2, 0x82], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xff]])(
        'rejects invalid UTF-8 without silently replacing text (%j)',
        async (...invalidBytes) => {
            // A quoted JSON string would parse with replacement characters if decoding were lenient.
            const bytes = new Uint8Array([0x22, ...invalidBytes, 0x22]);
            const parse = jest.spyOn(JSON, 'parse');
            await expect(parseLocalTranslationManifestBytes(bytes, hash(bytes), expected())).rejects.toThrow(INVALID);
            expect(parse).not.toHaveBeenCalled();
        },
    );

    it.each(['{"private-text":', JSON.stringify({ ...fixture(), jobRef: '550e8400-e29b-41d4-a716-446655440099' })])(
        'sanitizes JSON and contract errors after a matching hash',
        async text => {
            const bytes = new TextEncoder().encode(text);
            const error = await parseLocalTranslationManifestBytes(bytes, hash(bytes), expected()).catch((failure: Error) => failure);
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe(INVALID);
            expect((error as Error).cause).toBeUndefined();
            expect(String(error)).not.toContain(JOB);
            expect(String(error)).not.toContain('private-text');
        },
    );

    it('sanitizes a native digest failure without retaining its message or cause', async () => {
        const bytes = encoded(fixture());
        jest.mocked(digest).mockRejectedValueOnce(new Error(`private-text ${JOB}`));
        const error = await parseLocalTranslationManifestBytes(bytes, hash(bytes), expected()).catch((failure: Error) => failure);
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(INVALID);
        expect((error as Error).cause).toBeUndefined();
        expect(String(error)).not.toContain(JOB);
        expect(String(error)).not.toContain('private-text');
        expect(digest).toHaveBeenCalledTimes(1);
    });

    it('takes one defensive snapshot of bytes and reference before asynchronous hashing', async () => {
        const bytes = encoded(fixture());
        const originalHash = hash(bytes);
        const reference = expected();
        let finish!: () => void;
        jest.mocked(digest).mockImplementationOnce(
            (_algorithm, snapshot) =>
                new Promise(resolve => {
                    finish = () => resolve(nativeDigest(snapshot as Uint8Array));
                }),
        );
        const pending = parseLocalTranslationManifestBytes(bytes, originalHash, reference);
        bytes.fill(0xff);
        reference.jobRef = '550e8400-e29b-41d4-a716-446655440099';
        reference.regions[0]!.readingOrder = 99;
        finish();
        await expect(pending).resolves.toMatchObject({ jobRef: JOB, regions: [{ id: REGION, readingOrder: 0, translatedText: TEXT }] });
        expect(digest).toHaveBeenCalledTimes(1);
    });
});
