import { capabilitiesAreUsable, capabilityAcceptsMedia, capabilitySupportsPair, remoteProcessingCapabilitiesSchema } from '../remoteProcessingCapability';

function fixture() {
    return {
        contractVersion: '1.0',
        gatewayKey: 'gateway-alpha',
        generatedAt: '2026-09-02T12:00:00.000Z',
        validUntil: '2026-09-02T12:05:00.000Z',
        enabled: true,
        supportedLanguages: ['ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR'],
        supportedPairs: [{ source: 'ja', target: 'pt-BR' }],
        mediaLimits: { mimeTypes: ['image/jpeg'], maxBytes: 100, maxWidthPx: 100, maxHeightPx: 200, maxPixels: 20_000 },
        dailyInstallationQuota: 20,
        dailyGlobalQuota: 100,
        disclosure: {
            version: 'legal-v1',
            operatorName: 'Toonlira',
            operatorContact: 'privacy@toonlira.com',
            privacyPolicyUrl: 'https://toonlira.com/privacy',
            termsUrl: 'https://toonlira.com/terms',
            gatewayRegion: 'southamerica-east1',
            ocrRegion: 'us',
            translationLocation: 'global',
            originalRetentionSeconds: 3600,
            resultRetentionSeconds: 3600,
            metadataRetentionDays: 7,
            providerTrainingPolicy: 'No provider training.',
        },
    };
}

describe('MOB-FEAT-017 remote processing capabilities', () => {
    it('parses the strict v1 contract and gates pair, media and expiry', () => {
        const parsed = remoteProcessingCapabilitiesSchema.parse(fixture());

        expect(capabilitiesAreUsable(parsed, Date.parse('2026-09-02T12:01:00.000Z'))).toBe(true);
        expect(capabilitiesAreUsable(parsed, Date.parse('2026-09-02T12:06:00.000Z'))).toBe(false);
        expect(capabilitySupportsPair(parsed, 'ja', 'pt-BR')).toBe(true);
        expect(capabilitySupportsPair(parsed, 'pt-BR', 'ja')).toBe(false);
        expect(capabilityAcceptsMedia(parsed, { mimeType: 'image/jpeg', byteSize: 100, widthPx: 100, heightPx: 200 })).toBe(true);
        expect(capabilityAcceptsMedia(parsed, { mimeType: 'image/png', byteSize: 100, widthPx: 100, heightPx: 200 })).toBe(false);
    });

    it('accepts an empty operational set only while the gateway is disabled', () => {
        const disabled = remoteProcessingCapabilitiesSchema.parse({ ...fixture(), enabled: false, supportedPairs: [] });
        expect(capabilitiesAreUsable(disabled)).toBe(false);
        expect(capabilitySupportsPair(disabled, 'ja', 'pt-BR')).toBe(false);
        expect(remoteProcessingCapabilitiesSchema.safeParse({ ...fixture(), supportedPairs: [] }).success).toBe(false);
    });

    it('preserves the direction of the two Chinese variants in a partial matrix', () => {
        const parsed = remoteProcessingCapabilitiesSchema.parse({ ...fixture(), supportedPairs: [{ source: 'zh-Hant', target: 'zh-Hans' }] });
        expect(capabilitySupportsPair(parsed, 'zh-Hant', 'zh-Hans')).toBe(true);
        expect(capabilitySupportsPair(parsed, 'zh-Hans', 'zh-Hant')).toBe(false);
    });

    it.each([
        ['unknown field', { extra: true }],
        ['http legal URL', { disclosure: { ...fixture().disclosure, privacyPolicyUrl: 'http://unsafe.test/privacy' } }],
        ['unknown contract', { contractVersion: '2.0' }],
        ['superseded disclosure', { disclosure: { ...fixture().disclosure, version: '2026-09-07.v1' } }],
        [
            'legacy location disclosure',
            { disclosure: { ...fixture().disclosure, ocrRegion: undefined, translationLocation: undefined, processingRegions: ['us', 'us-central1'] } },
        ],
        ['unsupported translation location', { disclosure: { ...fixture().disclosure, translationLocation: 'us' } }],
        [
            'duplicate pair',
            {
                supportedPairs: [
                    { source: 'ja', target: 'pt-BR' },
                    { source: 'ja', target: 'pt-BR' },
                ],
            },
        ],
    ])('fails closed for %s', (_label, override) => {
        expect(remoteProcessingCapabilitiesSchema.safeParse({ ...fixture(), ...override }).success).toBe(false);
    });
});
