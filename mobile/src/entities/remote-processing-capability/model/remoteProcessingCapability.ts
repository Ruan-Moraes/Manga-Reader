import { z } from 'zod';

export const remoteLanguageSchema = z.enum(['ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR']);
export type RemoteLanguage = z.infer<typeof remoteLanguageSchema>;

const httpsUrl = z.url().refine(value => value.startsWith('https://'));
const languagePairSchema = z.object({ source: remoteLanguageSchema, target: remoteLanguageSchema }).strict();

export const legalDisclosureSchema = z
    .object({
        version: z.string().regex(/^volatile-[A-Za-z0-9._-]{1,55}$/),
        operatorName: z.string().min(1).max(160),
        operatorContact: z.email(),
        privacyPolicyUrl: httpsUrl,
        termsUrl: httpsUrl,
        gatewayRegion: z.literal('southamerica-east1'),
        ocrRegion: z.literal('us'),
        translationLocation: z.literal('global'),
        // Vertex AI location of the optional language review (text only, never the image); null while it is off.
        languageModelLocation: z
            .string()
            .regex(/^[a-z][a-z0-9-]{0,28}[a-z0-9]$/)
            .nullable(),
        contentProcessing: z.literal('in-memory-only'),
        resultStorage: z.literal('user-device'),
        sanitizedOperationalLogs: z.literal(true),
        idempotencyKeyFormat: z.literal('uuid-v7'),
        receiptValiditySeconds: z.literal(604800),
        providerTrainingPolicy: z.string().min(1).max(500),
    })
    .strict();

export const remoteProcessingCapabilitiesSchema = z
    .object({
        contractVersion: z.literal('2.0'),
        transport: z.literal('volatile-direct-response'),
        gatewayKey: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/),
        generatedAt: z.iso.datetime(),
        validUntil: z.iso.datetime(),
        enabled: z.boolean(),
        supportedLanguages: z.array(remoteLanguageSchema).min(2),
        supportedPairs: z.array(languagePairSchema).max(42),
        mediaLimits: z
            .object({
                mimeTypes: z.array(z.enum(['image/jpeg', 'image/png', 'image/webp'])).min(1),
                maxBytes: z
                    .number()
                    .int()
                    .positive()
                    .max(12 * 1024 * 1024),
                maxWidthPx: z.number().int().positive().max(12000),
                maxHeightPx: z.number().int().positive().max(12000),
                maxPixels: z.number().int().positive().max(80000000),
                maxResultBytes: z
                    .number()
                    .int()
                    .positive()
                    .max(64 * 1024 * 1024),
                maxManifestBytes: z
                    .number()
                    .int()
                    .positive()
                    .max(4 * 1024 * 1024),
            })
            .strict(),
        dailyInstallationQuota: z.literal([0, 20]),
        dailyGlobalQuota: z.literal(100),
        disclosure: legalDisclosureSchema,
    })
    .strict()
    .superRefine((capabilities, context) => {
        if (capabilities.enabled && capabilities.supportedPairs.length === 0) {
            context.addIssue({ code: 'custom', message: 'enabled gateway requires an operational pair' });
        }
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
    const maximumClockSkewMs = 5_000;

    return capabilities.enabled && Date.parse(capabilities.generatedAt) <= now + maximumClockSkewMs && Date.parse(capabilities.validUntil) > now;
}
