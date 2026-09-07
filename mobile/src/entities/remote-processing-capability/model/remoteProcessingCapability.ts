import { z } from 'zod';

export const remoteLanguageSchema = z.enum(['ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR']);
export type RemoteLanguage = z.infer<typeof remoteLanguageSchema>;

const httpsUrl = z.url().refine(value => value.startsWith('https://'));
const languagePairSchema = z.object({ source: remoteLanguageSchema, target: remoteLanguageSchema }).strict();

export const legalDisclosureSchema = z
    .object({
        version: z.string().min(1).max(64),
        operatorName: z.string().min(1).max(160),
        operatorContact: z.email(),
        privacyPolicyUrl: httpsUrl,
        termsUrl: httpsUrl,
        gatewayRegion: z.literal('southamerica-east1'),
        processingRegions: z.array(z.enum(['us', 'us-central1'])).min(1),
        originalRetentionSeconds: z.number().int().positive().max(3600),
        resultRetentionSeconds: z.number().int().positive().max(3600),
        metadataRetentionDays: z.number().int().positive().max(7),
        providerTrainingPolicy: z.string().min(1).max(500),
    })
    .strict();

export const remoteProcessingCapabilitiesSchema = z
    .object({
        contractVersion: z.literal('1.0'),
        gatewayKey: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
        generatedAt: z.iso.datetime(),
        validUntil: z.iso.datetime(),
        enabled: z.boolean(),
        supportedLanguages: z.array(remoteLanguageSchema).min(2),
        supportedPairs: z.array(languagePairSchema).min(1),
        mediaLimits: z
            .object({
                mimeTypes: z.array(z.enum(['image/jpeg', 'image/png', 'image/webp'])).min(1),
                maxBytes: z.number().int().positive(),
                maxWidthPx: z.number().int().positive(),
                maxHeightPx: z.number().int().positive(),
                maxPixels: z.number().int().positive(),
            })
            .strict(),
        dailyInstallationQuota: z.literal(20),
        dailyGlobalQuota: z.literal(100),
        disclosure: legalDisclosureSchema,
    })
    .strict()
    .superRefine((capabilities, context) => {
        if (Date.parse(capabilities.validUntil) <= Date.parse(capabilities.generatedAt)) {
            context.addIssue({ code: 'custom', message: 'invalid capability validity' });
        }
        const languages = new Set(capabilities.supportedLanguages);
        if (languages.size !== capabilities.supportedLanguages.length) {
            context.addIssue({ code: 'custom', message: 'duplicate supported language' });
        }
        if (new Set(capabilities.mediaLimits.mimeTypes).size !== capabilities.mediaLimits.mimeTypes.length) {
            context.addIssue({ code: 'custom', message: 'duplicate media type' });
        }
        if (new Set(capabilities.disclosure.processingRegions).size !== capabilities.disclosure.processingRegions.length) {
            context.addIssue({ code: 'custom', message: 'duplicate processing region' });
        }
        const pairs = new Set<string>();
        for (const pair of capabilities.supportedPairs) {
            const key = `${pair.source}:${pair.target}`;
            if (pair.source === pair.target || !languages.has(pair.source) || !languages.has(pair.target) || pairs.has(key)) {
                context.addIssue({ code: 'custom', message: 'invalid or duplicate language pair' });
            }
            pairs.add(key);
        }
    });

export type RemoteProcessingCapabilities = z.infer<typeof remoteProcessingCapabilitiesSchema>;

export function capabilitySupportsPair(capabilities: RemoteProcessingCapabilities, source: RemoteLanguage, target: RemoteLanguage): boolean {
    return capabilities.supportedPairs.some(pair => pair.source === source && pair.target === target);
}

export function capabilityAcceptsMedia(
    capabilities: RemoteProcessingCapabilities,
    media: { mimeType: string; byteSize: number; widthPx: number; heightPx: number },
): boolean {
    return (
        capabilities.mediaLimits.mimeTypes.some(mime => mime === media.mimeType) &&
        media.byteSize <= capabilities.mediaLimits.maxBytes &&
        media.widthPx <= capabilities.mediaLimits.maxWidthPx &&
        media.heightPx <= capabilities.mediaLimits.maxHeightPx &&
        media.widthPx * media.heightPx <= capabilities.mediaLimits.maxPixels
    );
}

export function capabilitiesAreUsable(capabilities: RemoteProcessingCapabilities, now = Date.now()): boolean {
    return capabilities.enabled && Date.parse(capabilities.generatedAt) <= now && Date.parse(capabilities.validUntil) > now;
}
