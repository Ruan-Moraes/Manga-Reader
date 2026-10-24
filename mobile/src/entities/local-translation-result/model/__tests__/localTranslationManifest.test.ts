import { type LocalTranslationManifestExpectation, parseLocalTranslationManifest } from '../localTranslationManifest';

const JOB = '550e8400-e29b-41d4-a716-446655440001';
const HASH = 'a'.repeat(64);
const regionId = (index: number) => `550e8400-e29b-41d4-a716-${index.toString(16).padStart(12, '0')}`;

function expected(count = 2): LocalTranslationManifestExpectation {
    return {
        jobRef: JOB,
        sourceLanguage: 'ja',
        targetLanguage: 'pt-BR',
        ocrManifestSha256: HASH,
        regions: Array.from({ length: count }, (_, readingOrder) => ({ id: regionId(readingOrder), readingOrder })),
    };
}

function fixture(count = 2) {
    return {
        version: '1.0',
        jobRef: JOB,
        sourceLanguage: 'ja',
        targetLanguage: 'pt-BR',
        ocrManifestSha256: HASH,
        model: 'general/translation-llm',
        regions: Array.from({ length: count }, (_, readingOrder) => ({
            id: regionId(readingOrder),
            readingOrder,
            translatedText: 'Texto\n漢字 😀 <b>literal</b>',
        })),
    };
}

describe('MOB-FEAT-019/AC-002/003/004 local translation manifest', () => {
    it('preserves surrounding whitespace and combining Unicode without interpreting markup', () => {
        const input = fixture(1);
        input.regions[0]!.translatedText = '  e\u0301\r\n漢字 <script>literal</script>  ';
        expect(parseLocalTranslationManifest(input, expected(1)).regions[0]?.translatedText).toBe(input.regions[0]!.translatedText);
    });

    it.each([null, undefined, [], {}, 'private-text', { ...fixture(), regions: null }])('rejects an invalid outer value without exposing it', value => {
        expect(() => parseLocalTranslationManifest(value, expected())).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('associates a reordered response by ID and preserves text and the original order', () => {
        const input = fixture();
        input.regions.reverse();
        const result = parseLocalTranslationManifest(input, expected());
        expect(result.regions.map(region => region.id)).toEqual(expected().regions.map(region => region.id));
        expect(result.regions[0]?.translatedText).toBe('Texto\n漢字 😀 <b>literal</b>');
        input.regions[0]!.translatedText = 'changed';
        expect(result.regions[1]?.translatedText).toBe('Texto\n漢字 😀 <b>literal</b>');
    });

    it.each([
        ['version', { version: '2.0' }],
        ['job', { jobRef: regionId(20) }],
        ['OCR hash', { ocrManifestSha256: 'b'.repeat(64) }],
        ['model', { model: 'general/nmt' }],
        ['source', { sourceLanguage: 'en' }],
        ['target', { targetLanguage: 'en' }],
        ['alias', { sourceLanguage: 'zh' }],
        ['unknown field', { extra: true }],
        ['missing ID', { regions: fixture().regions.slice(1) }],
        ['extra ID', { regions: [...fixture().regions, { id: regionId(3), readingOrder: 2, translatedText: 'extra' }] }],
        ['duplicate ID', { regions: [fixture().regions[0], fixture().regions[0]] }],
        ['changed order', { regions: fixture().regions.map(region => ({ ...region, readingOrder: 1 - region.readingOrder })) }],
        ['blank text', { regions: fixture().regions.map(region => ({ ...region, translatedText: ' \n' })) }],
        ['null text', { regions: fixture().regions.map(region => ({ ...region, translatedText: null })) }],
        ['region markup field', { regions: fixture().regions.map(region => ({ ...region, polygon: [] })) }],
    ])('fails closed for %s with a sanitized error', (_label, overrides) => {
        const action = () => parseLocalTranslationManifest({ ...fixture(), ...overrides }, expected());
        expect(action).toThrow('localTranslation.invalidRemoteManifest');
        try {
            action();
        } catch (error) {
            expect(String(error)).not.toContain(JOB);
            expect(String(error)).not.toContain('Texto');
            expect((error as Error).cause).toBeUndefined();
        }
    });

    it.each([
        ['zh-Hans', 'zh-Hant'],
        ['zh-Hant', 'zh-Hans'],
    ] as const)('preserves %s → %s explicitly', (sourceLanguage, targetLanguage) => {
        const result = parseLocalTranslationManifest({ ...fixture(), sourceLanguage, targetLanguage }, { ...expected(), sourceLanguage, targetLanguage });
        expect(result.sourceLanguage).toBe(sourceLanguage);
        expect(result.targetLanguage).toBe(targetLanguage);
    });

    it('accepts only an empty response for an empty OCR page', () => {
        expect(parseLocalTranslationManifest(fixture(0), expected(0)).regions).toEqual([]);
        expect(() => parseLocalTranslationManifest(fixture(1), expected(0))).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('enforces UTF-16 output limits without truncation', () => {
        const page = fixture(64);
        page.regions = page.regions.map(region => ({ ...region, translatedText: '😀'.repeat(4096) }));
        expect(parseLocalTranslationManifest(page, expected(64)).regions).toHaveLength(64);
        page.regions[0]!.translatedText += 'x';
        expect(() => parseLocalTranslationManifest(page, expected(64))).toThrow('localTranslation.invalidRemoteManifest');
        const aboveTotal = fixture(65);
        aboveTotal.regions = aboveTotal.regions.map(region => ({ ...region, translatedText: 'x'.repeat(8192) }));
        expect(() => parseLocalTranslationManifest(aboveTotal, expected(65))).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('enforces region count and validates expected IDs/order as well', () => {
        expect(parseLocalTranslationManifest(fixture(1024), expected(1024)).regions).toHaveLength(1024);
        expect(() => parseLocalTranslationManifest(fixture(1025), expected(1025))).toThrow('localTranslation.invalidRemoteManifest');
        expect(() => parseLocalTranslationManifest(fixture(), { ...expected(), regions: expected().regions.toReversed() })).toThrow(
            'localTranslation.invalidRemoteManifest',
        );
        expect(() => parseLocalTranslationManifest(fixture(), { ...expected(), targetLanguage: 'ja' })).toThrow('localTranslation.invalidRemoteManifest');
    });
});
