import { buildLocalTranslatedRegions } from '../localTranslationManifest';

const JOB = '550e8400-e29b-41d4-a716-446655440001';
const HASH = 'a'.repeat(64);
const ACQUIRED_AT = 1_791_024_000_000;
const regionId = (index: number) => `550e8400-e29b-41d4-a716-${index.toString(16).padStart(12, '0')}`;

function polygon() {
    return [
        { x: 0.125, y: 0.25 },
        { x: 0.875, y: 0.25 },
        { x: 0.875, y: 0.75 },
        { x: 0.125, y: 0.75 },
    ];
}

function reference(count = 2) {
    return {
        jobRef: JOB,
        sourceLanguage: 'ja' as const,
        targetLanguage: 'pt-BR' as const,
        ocrManifestSha256: HASH,
        regions: Array.from({ length: count }, (_, readingOrder) => ({
            id: regionId(readingOrder),
            readingOrder,
            sourceText: `  原文${readingOrder}\r\ne\u0301😀 <b>literal</b>  `,
            polygon: polygon(),
        })),
    };
}

function manifest(count = 2) {
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
            translatedText: `  Tradução ${readingOrder}\r\ne\u0301😀 <script>literal</script>  `,
        })),
    };
}

describe('MOB-FEAT-019/AC-002/003/004 local region association', () => {
    it('joins by ID, preserving OCR text, polygon and order independently of response order', () => {
        const source = reference();
        const translated = manifest();
        translated.regions.reverse();
        const rows = buildLocalTranslatedRegions(translated, source, ACQUIRED_AT);

        expect(rows).toEqual(
            source.regions.map(region => ({
                id: region.id,
                readingOrder: region.readingOrder,
                sourceText: region.sourceText,
                translatedText: translated.regions.find(item => item.id === region.id)!.translatedText,
                vertices: region.polygon.map((point, index) => ({ index, ...point })),
                translationMetadata: { contractVersion: '1.0', model: 'general/translation-llm', translatedAt: ACQUIRED_AT },
            })),
        );
        for (const field of ['pageId', 'overflow', 'readyAt', 'createdAt', 'status']) expect(rows[0]).not.toHaveProperty(field);
    });

    it('makes independent immutable snapshots without modifying the caller inputs', () => {
        const source = reference();
        const translated = manifest();
        const before = JSON.stringify({ source, translated });
        const rows = buildLocalTranslatedRegions(translated, source, ACQUIRED_AT);
        expect(JSON.stringify({ source, translated })).toBe(before);
        source.regions[0]!.sourceText = 'changed source';
        source.regions[0]!.polygon[0]!.x = 0.5;
        translated.regions[0]!.translatedText = 'changed translation';
        expect(rows[0]!.sourceText).toContain('原文0');
        expect(rows[0]!.translatedText).toContain('Tradução 0');
        expect(rows[0]!.vertices[0]!.x).toBe(0.125);
        expect(Object.isFrozen(rows)).toBe(true);
        expect(Object.isFrozen(rows[0])).toBe(true);
        expect(Object.isFrozen(rows[0]!.vertices)).toBe(true);
        expect(Object.isFrozen(rows[0]!.vertices[0])).toBe(true);
        expect(Object.isFrozen(rows[0]!.translationMetadata)).toBe(true);
        expect(() => Object.assign(rows[0]!.translationMetadata, { translatedAt: 1 })).toThrow();
    });

    it.each([
        ['zh-Hans', 'zh-Hant'],
        ['zh-Hant', 'zh-Hans'],
        ['pt-BR', 'en'],
    ] as const)('preserves %s → %s without aliases or content conversion', (sourceLanguage, targetLanguage) => {
        const input = { ...manifest(), sourceLanguage, targetLanguage };
        const expected = { ...reference(), sourceLanguage, targetLanguage };
        expect(buildLocalTranslatedRegions(input, expected, ACQUIRED_AT)[0]!.sourceText).toBe(expected.regions[0]!.sourceText);
        expect(buildLocalTranslatedRegions(input, expected, ACQUIRED_AT)[0]!.translatedText).toBe(input.regions[0]!.translatedText);
        expect(() => buildLocalTranslatedRegions({ ...input, targetLanguage: 'zh' }, expected, ACQUIRED_AT)).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('produces an empty immutable list only for an empty valid page', () => {
        const rows = buildLocalTranslatedRegions(manifest(0), reference(0), ACQUIRED_AT);
        expect(rows).toEqual([]);
        expect(Object.isFrozen(rows)).toBe(true);
        expect(() => buildLocalTranslatedRegions(manifest(1), reference(0), ACQUIRED_AT)).toThrow('localTranslation.invalidRemoteManifest');
        expect(() => buildLocalTranslatedRegions(manifest(0), { ...reference(0), targetLanguage: 'ja' }, ACQUIRED_AT)).toThrow(
            'localTranslation.invalidRemoteManifest',
        );
    });

    it.each([0, -1, 1.25, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])('rejects an invalid local timestamp %s', timestamp => {
        expect(() => buildLocalTranslatedRegions(manifest(), reference(), timestamp)).toThrow('localTranslation.invalidRemoteManifest');
    });

    it.each([
        null,
        undefined,
        { ...reference(), jobRef: null },
        { ...reference(), ocrManifestSha256: 'not-a-hash' },
        { ...reference(), sourceLanguage: 'zh' },
        { ...reference(), targetLanguage: 'ja' },
        { ...reference(), extra: 'private content' },
    ])('rejects an invalid reference before returning a local contract', expected => {
        expect(() => buildLocalTranslatedRegions(manifest(), expected as never, ACQUIRED_AT)).toThrow('localTranslation.invalidRemoteManifest');
    });

    it.each([
        ['null source', null],
        ['null region', [null]],
        ['null ID', [{ ...reference(1).regions[0], id: null }]],
        ['duplicate ID', [reference(1).regions[0], { ...reference(1).regions[0], readingOrder: 1 }]],
        ['reversed order', reference().regions.toReversed()],
        ['blank source', [{ ...reference(1).regions[0], sourceText: ' \n' }]],
        ['null source text', [{ ...reference(1).regions[0], sourceText: null }]],
        ['extra source field', [{ ...reference(1).regions[0], translatedText: 'spoofed' }]],
        ['missing polygon', [{ ...reference(1).regions[0], polygon: undefined }]],
    ])('rejects %s before producing any rows', (_label, regions) => {
        expect(() => buildLocalTranslatedRegions(manifest(), { ...reference(), regions } as never, ACQUIRED_AT)).toThrow(
            'localTranslation.invalidRemoteManifest',
        );
    });

    it.each([
        ['too few', polygon().slice(0, 3)],
        ['too many', [...polygon(), { x: 0.5, y: 0.5 }]],
        ['null vertex', [null, ...polygon().slice(1)]],
        ['outside image', [{ x: -0.01, y: 0.25 }, ...polygon().slice(1)]],
        ['nonfinite', [{ x: Number.NaN, y: 0.25 }, ...polygon().slice(1)]],
        ['degenerate', Array.from({ length: 4 }, () => ({ x: 0.5, y: 0.5 }))],
        ['crossed', [polygon()[0], polygon()[2], polygon()[1], polygon()[3]]],
        ['concave', [polygon()[0], polygon()[1], { x: 0.5, y: 0.3 }, polygon()[3]]],
        [
            'tiny cross product',
            [
                { x: 0, y: 0 },
                { x: 0.00001, y: 0 },
                { x: 0.00001, y: 0.00001 },
                { x: 0, y: 0.00001 },
            ],
        ],
        ['extra vertex field', [{ ...polygon()[0], corrected: true }, ...polygon().slice(1)]],
    ])('rejects a %s polygon without inventing coordinates', (_label, points) => {
        const source = reference(1);
        expect(() =>
            buildLocalTranslatedRegions(manifest(1), { ...source, regions: [{ ...source.regions[0], polygon: points }] } as never, ACQUIRED_AT),
        ).toThrow('localTranslation.invalidRemoteManifest');
    });

    it.each([false, true])('preserves valid vertex orientation and image boundaries (reverse=%s)', reverse => {
        const points = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ];
        if (reverse) points.reverse();
        const source = reference(1);
        source.regions[0]!.polygon = points;
        expect(buildLocalTranslatedRegions(manifest(1), source, ACQUIRED_AT)[0]!.vertices).toEqual(points.map((point, index) => ({ index, ...point })));
    });

    it('accepts the same minimum cross product as the gateway without rounding the polygon', () => {
        const source = reference(1);
        source.regions[0]!.polygon = [
            { x: 0, y: 0 },
            { x: 0.0001, y: 0 },
            { x: 0.0001, y: 0.0001 },
            { x: 0, y: 0.0001 },
        ];
        expect(buildLocalTranslatedRegions(manifest(1), source, ACQUIRED_AT)[0]!.vertices).toEqual(
            source.regions[0]!.polygon.map((point, index) => ({ index, ...point })),
        );
    });

    it('checks source UTF-16 boundaries, including the page sum, without trimming or truncation', () => {
        const source = reference(64);
        source.regions.forEach(region => {
            region.sourceText = '😀'.repeat(2048);
        });
        expect(buildLocalTranslatedRegions(manifest(64), source, ACQUIRED_AT)).toHaveLength(64);
        source.regions[0]!.sourceText += 'x';
        expect(() => buildLocalTranslatedRegions(manifest(64), source, ACQUIRED_AT)).toThrow('localTranslation.invalidRemoteManifest');
        const tooMuch = reference(65);
        tooMuch.regions.forEach(region => {
            region.sourceText = 'x'.repeat(4096);
        });
        expect(() => buildLocalTranslatedRegions(manifest(65), tooMuch, ACQUIRED_AT)).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('accepts 1024 regions and rejects the next region', () => {
        expect(buildLocalTranslatedRegions(manifest(1024), reference(1024), ACQUIRED_AT)).toHaveLength(1024);
        expect(() => buildLocalTranslatedRegions(manifest(1025), reference(1025), ACQUIRED_AT)).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('reuses integral response validation rather than accepting partial or altered translations', () => {
        const input = manifest();
        const source = reference();
        expect(() => buildLocalTranslatedRegions({ ...input, regions: input.regions.slice(1) }, source, ACQUIRED_AT)).toThrow(
            'localTranslation.invalidRemoteManifest',
        );
        expect(() => buildLocalTranslatedRegions({ ...input, ocrManifestSha256: 'b'.repeat(64) }, source, ACQUIRED_AT)).toThrow(
            'localTranslation.invalidRemoteManifest',
        );
        expect(() =>
            buildLocalTranslatedRegions({ ...input, regions: input.regions.map(region => ({ ...region, polygon: polygon() })) }, source, ACQUIRED_AT),
        ).toThrow('localTranslation.invalidRemoteManifest');
        input.regions[0]!.translatedText = 'x'.repeat(8193);
        expect(() => buildLocalTranslatedRegions(input, source, ACQUIRED_AT)).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('sanitizes even a thrown source accessor without including content, job, hash or cause', () => {
        const source = reference();
        Object.defineProperty(source.regions[0], 'sourceText', {
            get() {
                throw new Error(`private text ${JOB} ${HASH}`);
            },
        });
        try {
            buildLocalTranslatedRegions(manifest(), source, ACQUIRED_AT);
            throw new Error('should reject');
        } catch (error) {
            expect((error as Error).message).toBe('localTranslation.invalidRemoteManifest');
            expect(String(error)).not.toContain(JOB);
            expect(String(error)).not.toContain(HASH);
            expect(String(error)).not.toContain('private text');
            expect((error as Error).cause).toBeUndefined();
        }
    });
});
