import { z } from 'zod';

import { type RemoteLanguage, remoteLanguageSchema } from '@/entities/remote-processing-capability/@x/local-translation-result';
import { sha256Bytes } from '@/shared/files';

import type { TextRegion } from './localTranslationResult';

const MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
const MAX_SOURCE_TEXT_PER_REGION = 4096;
const MAX_SOURCE_TEXT_TOTAL = 262144;
const MIN_POLYGON_CROSS_PRODUCT = 1e-8;

export interface LocalTranslationManifestExpectation {
    jobRef: string;
    sourceLanguage: RemoteLanguage;
    targetLanguage: RemoteLanguage;
    ocrManifestSha256: string;
    regions: readonly { id: string; readingOrder: number }[];
}

export interface LocalTranslationRegionExpectation extends LocalTranslationManifestExpectation {
    regions: readonly {
        id: string;
        readingOrder: number;
        sourceText: string;
        polygon: readonly { x: number; y: number }[];
    }[];
}

export type LocalTranslatedRegion = Readonly<Pick<TextRegion, 'id' | 'readingOrder' | 'sourceText' | 'translatedText'>> & {
    readonly translationMetadata: Readonly<NonNullable<TextRegion['translationMetadata']>>;
    readonly vertices: readonly Readonly<TextRegion['vertices'][number]>[];
};

function validOcrPolygon(points: readonly { x: number; y: number }[]): boolean {
    if (points.length !== 4) return false;
    let direction = 0;
    for (let index = 0; index < 4; index++) {
        const a = points[index]!;
        const b = points[(index + 1) % 4]!;
        const c = points[(index + 2) % 4]!;
        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        if (Math.abs(cross) < MIN_POLYGON_CROSS_PRODUCT || (direction !== 0 && Math.sign(cross) !== direction)) return false;
        direction = Math.sign(cross);
    }
    return true;
}

const regionIdentitySchema = z.object({ id: z.uuid(), readingOrder: z.number().int().nonnegative() }).strict();
const expectationSchema = z
    .object({
        jobRef: z.uuid(),
        sourceLanguage: remoteLanguageSchema,
        targetLanguage: remoteLanguageSchema,
        ocrManifestSha256: z.string().regex(/^[a-f0-9]{64}$/),
        regions: z.array(regionIdentitySchema).max(1024),
    })
    .strict();

const sourceExpectationSchema = expectationSchema.extend({
    regions: z
        .array(
            regionIdentitySchema.extend({
                sourceText: z
                    .string()
                    .max(MAX_SOURCE_TEXT_PER_REGION)
                    .refine(text => text.trim().length > 0),
                polygon: z
                    .array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict())
                    .length(4)
                    .refine(validOcrPolygon),
            }),
        )
        .max(1024),
});

const manifestSchema = expectationSchema
    .extend({
        version: z.literal('1.0'),
        model: z.literal('general/translation-llm'),
        regions: z
            .array(
                regionIdentitySchema
                    .extend({
                        translatedText: z
                            .string()
                            .max(8192)
                            .refine(text => text.trim().length > 0),
                    })
                    .strict(),
            )
            .max(1024),
    })
    .strict();

export type LocalTranslationManifest = z.infer<typeof manifestSchema>;

function invalidManifest(): Error {
    return new Error('localTranslation.invalidRemoteManifest');
}

function parseExpectation(expected: LocalTranslationManifestExpectation): LocalTranslationManifestExpectation {
    const reference = expectationSchema.safeParse(expected);
    if (!reference.success) throw invalidManifest();
    const request = reference.data;
    if (
        request.sourceLanguage === request.targetLanguage ||
        new Set(request.regions.map(region => region.id)).size !== request.regions.length ||
        request.regions.some((region, index) => region.readingOrder !== index)
    )
        throw invalidManifest();
    return request;
}

/** Parses objects only: it does not verify their source bytes or fetch, store or ACK anything. */
export function parseLocalTranslationManifest(value: unknown, expected: LocalTranslationManifestExpectation): LocalTranslationManifest {
    const request = parseExpectation(expected);
    const response = manifestSchema.safeParse(value);

    if (!response.success) throw invalidManifest();
    const manifest = response.data;
    if (
        manifest.jobRef !== request.jobRef ||
        manifest.sourceLanguage !== request.sourceLanguage ||
        manifest.targetLanguage !== request.targetLanguage ||
        manifest.ocrManifestSha256 !== request.ocrManifestSha256 ||
        manifest.regions.length !== request.regions.length
    )
        throw invalidManifest();

    const byId = new Map(manifest.regions.map(region => [region.id, region]));
    if (byId.size !== manifest.regions.length || manifest.regions.reduce((total, region) => total + region.translatedText.length, 0) > 524288) {
        throw invalidManifest();
    }
    const ordered = request.regions.map(region => {
        const translated = byId.get(region.id);
        if (!translated || translated.readingOrder !== region.readingOrder) throw invalidManifest();
        return translated;
    });
    return { ...manifest, regions: ordered };
}

/** Associates objects only; trusted OCR/hash and acquisition time must come from the caller. No persistence or READY. */
export function buildLocalTranslatedRegions(value: unknown, expected: LocalTranslationRegionExpectation, acquiredAt: number): readonly LocalTranslatedRegion[] {
    try {
        if (!Number.isSafeInteger(acquiredAt) || acquiredAt <= 0) throw invalidManifest();
        const source = sourceExpectationSchema.safeParse(expected);
        if (!source.success || source.data.regions.reduce((total, region) => total + region.sourceText.length, 0) > MAX_SOURCE_TEXT_TOTAL) {
            throw invalidManifest();
        }
        const reference = source.data;
        const translated = parseLocalTranslationManifest(value, {
            ...reference,
            regions: reference.regions.map(region => ({ id: region.id, readingOrder: region.readingOrder })),
        });
        return Object.freeze(
            reference.regions.map((region, index) =>
                Object.freeze({
                    id: region.id,
                    readingOrder: region.readingOrder,
                    sourceText: region.sourceText,
                    translatedText: translated.regions[index]!.translatedText,
                    translationMetadata: Object.freeze({ contractVersion: translated.version, model: translated.model, translatedAt: acquiredAt }),
                    vertices: Object.freeze(region.polygon.map((point, index) => Object.freeze({ index, x: point.x, y: point.y }))),
                }),
            ),
        );
    } catch {
        throw invalidManifest();
    }
}

/** Validates already acquired bytes against a trusted hash; no network, storage or ACK. */
export async function parseLocalTranslationManifestBytes(
    bytes: Uint8Array,
    manifestSha256: string,
    expected: LocalTranslationManifestExpectation,
): Promise<LocalTranslationManifest> {
    if (
        !(bytes instanceof Uint8Array) ||
        bytes.byteLength === 0 ||
        bytes.byteLength > MAX_MANIFEST_BYTES ||
        typeof manifestSha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(manifestSha256)
    )
        throw invalidManifest();

    const reference = parseExpectation(expected);
    // Hashing is asynchronous: decode the same snapshot, not caller-owned mutable bytes.
    const snapshot = new Uint8Array(bytes);
    try {
        if ((await sha256Bytes(snapshot)) !== manifestSha256) throw invalidManifest();
        const text = new TextDecoder('utf-8', { fatal: true }).decode(snapshot);
        return parseLocalTranslationManifest(JSON.parse(text) as unknown, reference);
    } catch {
        // Neither native errors nor JSON snippets may carry remote text into observability.
        throw invalidManifest();
    }
}
