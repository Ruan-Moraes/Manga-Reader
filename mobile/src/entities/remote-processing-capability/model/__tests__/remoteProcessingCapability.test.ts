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
            processingRegions: ['us', 'us-central1'],
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

    it.each([
        ['unknown field', { extra: true }],
        ['http legal URL', { disclosure: { ...fixture().disclosure, privacyPolicyUrl: 'http://unsafe.test/privacy' } }],
        ['unknown contract', { contractVersion: '2.0' }],
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
