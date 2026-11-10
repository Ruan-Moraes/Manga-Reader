import { z } from 'zod';

import { remoteLanguageSchema } from '@/entities/remote-processing-capability/@x/local-translation-result';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const imageSchema = z
    .object({
        mimeType: z.literal('image/webp'),
        byteSize: z
            .number()
            .int()
            .positive()
            .max(64 * 1024 * 1024),
        widthPx: z.number().int().positive().max(12000),
        heightPx: z.number().int().positive().max(12000),
        sha256: hash,
    })
    .strict();
const vertex = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();
const region = z
    .object({
        id: z.uuid(),
        readingOrder: z.number().int().nonnegative(),
        sourceText: z.string().min(1).max(4096),
        translatedText: z.string().min(1).max(8192),
        polygon: z.array(vertex).min(4).max(8),
        overflow: z.boolean(),
        fontSizePx: z.number().int().min(0).max(48),
    })
    .strict();
const schema = z
    .object({
        version: z.literal('1.0'),
        policyVersion: z.enum(['clean-box-1.0', 'clean-box-1.1']),
        jobRef: z.uuid(),
        sourceLanguage: remoteLanguageSchema,
        targetLanguage: remoteLanguageSchema,
        originalSha256: hash,
        ocrSha256: hash,
        translationSha256: hash,
        image: imageSchema,
        regions: z.array(region).max(1024),
    })
    .strict();
export type RenderedTranslationManifest = z.infer<typeof schema>;
export interface RenderedManifestExpectation {
    jobRef: string;
    sourceLanguage: string;
    targetLanguage: string;
    originalSha256: string;
    image: { mimeType: string; byteSize: number; widthPx: number; heightPx: number; sha256: string };
}
function validPolygon(points: readonly { x: number; y: number }[]): boolean {
    let sign = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i]!,
            b = points[(i + 1) % points.length]!,
            c = points[(i + 2) % points.length]!;
        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        if (Math.abs(cross) < 1e-8 || (sign && Math.sign(cross) !== sign)) return false;
        sign = Math.sign(cross);
        for (let j = 0; j < points.length; j++) {
            if (j === i || j === (i + 1) % points.length) continue;
            const point = points[j]!;
            const side = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
            if (Math.abs(side) < 1e-8 || Math.sign(side) !== sign) return false;
        }
    }
    return true;
}
function rejectDuplicateKeys(text: string): void {
    const stack: (Set<string> | null)[] = [];
    const tokens = /"(?:\\.|[^"\\])*"|[{}[\]]/g;
    let token: RegExpExecArray | null;
    while ((token = tokens.exec(text))) {
        const value = token[0];
        if (value === '{' || value === '[') {
            stack.push(value === '{' ? new Set() : null);
            if (stack.length > 32) throw new Error();
        } else if (value === '}' || value === ']') stack.pop();
        else {
            let cursor = tokens.lastIndex;
            while (/\s/.test(text[cursor] ?? '') && cursor < text.length) cursor++;
            if (text[cursor] !== ':') continue;
            const keys = stack[stack.length - 1];
            const key = JSON.parse(value) as string;
            if (!keys || keys.has(key)) throw new Error();
            keys.add(key);
        }
    }
}
/** Final manifest is untrusted even after hashing; never expose parser snippets or invent model metadata. */
export function parseRenderedTranslationManifest(bytes: Uint8Array, expected: RenderedManifestExpectation): RenderedTranslationManifest {
    try {
        if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new Error();
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        rejectDuplicateKeys(text);
        const result = schema.parse(JSON.parse(text));
        if (
            result.jobRef !== expected.jobRef ||
            result.sourceLanguage !== expected.sourceLanguage ||
            result.targetLanguage !== expected.targetLanguage ||
            result.sourceLanguage === result.targetLanguage ||
            result.originalSha256 !== expected.originalSha256 ||
            Object.entries(expected.image).some(([key, value]) => result.image[key as keyof typeof result.image] !== value) ||
            result.image.widthPx * result.image.heightPx > 80000000 ||
            new Set(result.regions.map(r => r.id)).size !== result.regions.length ||
            result.regions.some(
                (r, i) =>
                    r.readingOrder !== i ||
                    !r.sourceText.trim() ||
                    !r.translatedText.trim() ||
                    !validPolygon(r.polygon) ||
                    (r.overflow ? r.fontSizePx !== 0 : r.fontSizePx < 12),
            ) ||
            result.regions.reduce((n, r) => n + r.sourceText.length, 0) > 262144 ||
            result.regions.reduce((n, r) => n + r.translatedText.length, 0) > 524288
        )
            throw new Error();
        return result;
    } catch {
        throw new Error('localTranslation.invalidRemoteManifest');
    }
}
