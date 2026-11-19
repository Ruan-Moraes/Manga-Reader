import { z } from 'zod';

import { type RemoteLanguage, remoteLanguageSchema } from '@/entities/remote-processing-capability/@x/local-translation-result';
import { sha256Bytes } from '@/shared/files';

const MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
const MAX_REGIONS = 1024;
const MAX_TEXT_TOTAL = 524288;

/** What the trusted READY envelope already promised about this page; the manifest must agree with all of it. */
export interface RemoteRenderManifestExpectation {
    jobRef: string;
    sourceLanguage: RemoteLanguage;
    targetLanguage: RemoteLanguage;
    image: { sha256: string; byteSize: number; widthPx: number; heightPx: number };
}

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const pointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();

const manifestSchema = z
    .object({
        version: z.literal('1.1'),
        policyVersion: z.string().min(1).max(64),
        jobRef: z.uuid(),
        sourceLanguage: remoteLanguageSchema,
        targetLanguage: remoteLanguageSchema,
        originalSha256: sha256Schema,
        ocrSha256: sha256Schema,
        translationSha256: sha256Schema,
        image: z
            .object({
                mimeType: z.literal('image/webp'),
                byteSize: z.number().int().positive(),
                widthPx: z.number().int().positive(),
                heightPx: z.number().int().positive(),
                sha256: sha256Schema,
            })
            .strict(),
        regions: z
            .array(
                z
                    .object({
                        id: z.uuid(),
                        readingOrder: z.number().int().nonnegative(),
                        sourceText: z.string().max(4096),
                        translatedText: z.string().max(8192),
                        polygon: z.array(pointSchema).length(4),
                        overflow: z.boolean(),
                        fontSizePx: z.number().int().min(0).max(512),
                        kept: z.boolean(),
                    })
                    .strict(),
            )
            .max(MAX_REGIONS),
        quality: z
            .object({
                status: z.enum(['OK', 'NEEDS_REVIEW']),
                issues: z.array(z.string().min(1).max(64)).max(8),
            })
            .strict()
            .optional(),
    })
    .strict();

export type RemoteRenderManifest = z.infer<typeof manifestSchema>;

function invalidManifest(): Error {
    return new Error('localTranslation.invalidRemoteManifest');
}

/**
 * The renderer's manifest (version 1.1) of a READY page, validated as untrusted input against the job, languages
 * and image the envelope announced. A page without text has no regions and is still valid.
 */
export function parseRemoteRenderManifest(value: unknown, expected: RemoteRenderManifestExpectation): RemoteRenderManifest {
    const parsed = manifestSchema.safeParse(value);
    if (!parsed.success) throw invalidManifest();
    const manifest = parsed.data;
    if (
        manifest.jobRef !== expected.jobRef ||
        manifest.sourceLanguage !== expected.sourceLanguage ||
        manifest.targetLanguage !== expected.targetLanguage ||
        manifest.image.sha256 !== expected.image.sha256 ||
        manifest.image.byteSize !== expected.image.byteSize ||
        manifest.image.widthPx !== expected.image.widthPx ||
        manifest.image.heightPx !== expected.image.heightPx ||
        new Set(manifest.regions.map(region => region.id)).size !== manifest.regions.length ||
        manifest.regions.some((region, index) => region.readingOrder !== index) ||
        manifest.regions.reduce((total, region) => total + region.sourceText.length + region.translatedText.length, 0) > MAX_TEXT_TOTAL
    ) {
        throw invalidManifest();
    }
    return manifest;
}

/** Validates downloaded bytes against the envelope's hash before any JSON is read; no network, storage or ACK. */
export async function parseRemoteRenderManifestBytes(
    bytes: Uint8Array,
    manifestSha256: string,
    expected: RemoteRenderManifestExpectation,
): Promise<RemoteRenderManifest> {
    if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_MANIFEST_BYTES || !/^[a-f0-9]{64}$/.test(manifestSha256)) {
        throw invalidManifest();
    }
    const snapshot = new Uint8Array(bytes);
    try {
        if ((await sha256Bytes(snapshot)) !== manifestSha256) throw invalidManifest();
        return parseRemoteRenderManifest(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(snapshot)) as unknown, expected);
    } catch {
        // Neither native errors nor JSON snippets may carry page text into observability.
        throw invalidManifest();
    }
}
