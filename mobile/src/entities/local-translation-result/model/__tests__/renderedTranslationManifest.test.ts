import { parseRenderedTranslationManifest } from '../renderedTranslationManifest';
const JOB = '30000000-0000-4000-8000-000000000001';
export const renderedFixture = () => ({
    version: '1.0',
    policyVersion: 'clean-box-1.1',
    jobRef: JOB,
    sourceLanguage: 'en',
    targetLanguage: 'pt-BR',
    originalSha256: 'a'.repeat(64),
    ocrSha256: 'b'.repeat(64),
    translationSha256: 'c'.repeat(64),
    image: { mimeType: 'image/webp', byteSize: 100, widthPx: 900, heightPx: 600, sha256: 'd'.repeat(64) },
    regions: [
        {
            id: '40000000-0000-4000-8000-000000000001',
            readingOrder: 0,
            sourceText: 'Hello!',
            translatedText: 'Olá!',
            polygon: [
                { x: 0.1, y: 0.1 },
                { x: 0.9, y: 0.1 },
                { x: 0.9, y: 0.8 },
                { x: 0.1, y: 0.8 },
            ],
            overflow: false,
            fontSizePx: 27,
        },
    ],
});
const expected = () => ({ jobRef: JOB, sourceLanguage: 'en', targetLanguage: 'pt-BR', originalSha256: 'a'.repeat(64), image: renderedFixture().image });
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
it('validates the final artifact against original and trusted image metadata, preserving exact text', () => {
    expect(parseRenderedTranslationManifest(bytes(renderedFixture()), expected()).regions[0]?.translatedText).toBe('Olá!');
});
it('accepts art-only pages without manufacturing regions', () => {
    expect(parseRenderedTranslationManifest(bytes({ ...renderedFixture(), regions: [] }), expected()).regions).toEqual([]);
});
it.each([
    { version: '2.0' },
    { policyVersion: 'unknown' },
    { jobRef: '00000000-0000-4000-8000-000000000001' },
    { sourceLanguage: 'ja' },
    { targetLanguage: 'es' },
    { originalSha256: 'e'.repeat(64) },
    { extra: 'unknown' },
    { image: { ...renderedFixture().image, widthPx: 100 } },
    { regions: [renderedFixture().regions[0], renderedFixture().regions[0]] },
    { regions: [{ ...renderedFixture().regions[0], readingOrder: 1 }] },
    { regions: [{ ...renderedFixture().regions[0], overflow: true, fontSizePx: 27 }] },
    { regions: [{ ...renderedFixture().regions[0], polygon: Array(4).fill({ x: 0.1, y: 0.1 }) }] },
])('rejects malformed or mismatched data %j', patch => {
    expect(() => parseRenderedTranslationManifest(bytes({ ...renderedFixture(), ...patch }), expected())).toThrow('localTranslation.invalidRemoteManifest');
});
it('rejects duplicate JSON keys, invalid UTF-8, excessive bytes and sanitized errors', () => {
    const json = JSON.stringify(renderedFixture()).replace('"version":"1.0"', '"version":"1.0","version":"1.0"');
    for (const input of [new TextEncoder().encode(json), new Uint8Array([0xff]), new Uint8Array(4 * 1024 * 1024 + 1)]) {
        expect(() => parseRenderedTranslationManifest(input, expected())).toThrow('localTranslation.invalidRemoteManifest');
    }
});

it('rejects self-intersecting stars even when consecutive turns have the same sign', () => {
    const polygon = [0, 2, 4, 1, 3].map(index => ({ x: 0.5 + 0.4 * Math.cos((index * 2 * Math.PI) / 5), y: 0.5 + 0.4 * Math.sin((index * 2 * Math.PI) / 5) }));
    expect(() =>
        parseRenderedTranslationManifest(bytes({ ...renderedFixture(), regions: [{ ...renderedFixture().regions[0], polygon }] }), expected()),
    ).toThrow('localTranslation.invalidRemoteManifest');
});
