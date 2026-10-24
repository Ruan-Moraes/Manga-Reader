import { ExternalLinkError, normalizeHttpsUrl, openConfiguredHttpsUrl, readConfiguredExternalLinks } from '../externalLinks';

describe('MOB-FEAT-008/AC-007 configured external links', () => {
    it('keeps only known, valid HTTPS links and does not create defaults', () => {
        expect(
            readConfiguredExternalLinks({
                expoConfig: {
                    extra: {
                        externalLinks: {
                            support: 'https://support.example/help',
                            terms: 'http://example.com/terms',
                            privacy: 'not-a-url',
                            project: 'https://example.com/project',
                            newsletter: 'https://example.com/newsletter',
                        },
                    },
                },
            }),
        ).toEqual({
            support: 'https://support.example/help',
            project: 'https://example.com/project',
        });
        expect(readConfiguredExternalLinks({})).toEqual({});
    });

    it.each(['http://example.com', '//example.com', 'mailto:user@example.com', 'https://user:secret@example.com', '', 'not a url'])(
        'rejects unsafe or invalid URL %s',
        value => {
            expect(normalizeHttpsUrl(value)).toBeNull();
        },
    );

    it('opens the normalized HTTPS URL through the native adapter', async () => {
        const open = jest.fn().mockResolvedValue(undefined);
        await openConfiguredHttpsUrl(' https://example.com/help ', open);
        expect(open).toHaveBeenCalledWith('https://example.com/help');
    });

    it('reports validation and native opening failures separately for localized recovery', async () => {
        await expect(openConfiguredHttpsUrl('http://example.com', jest.fn())).rejects.toEqual(
            expect.objectContaining({ code: 'invalid-url' }) as ExternalLinkError,
        );

        const cause = new Error('offline');
        await expect(openConfiguredHttpsUrl('https://example.com', jest.fn().mockRejectedValue(cause))).rejects.toEqual(
            expect.objectContaining({ code: 'open-failed', cause }) as ExternalLinkError,
        );
    });
});
