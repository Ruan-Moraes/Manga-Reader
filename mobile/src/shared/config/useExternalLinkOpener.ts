import { useCallback, useState } from 'react';

import { externalLinks } from './externalLinks';

/**
 * MOB-FEAT-064: opens an https link in the browser and remembers the one that failed, so the screen can show a
 * localized error with a retry instead of an unhandled rejection.
 */
export function useExternalLinkOpener() {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);

    const open = useCallback(async (url: string) => {
        setFailedUrl(null);
        try {
            await externalLinks.open(url);
        } catch {
            setFailedUrl(url);
        }
    }, []);

    const retry = useCallback(() => {
        if (failedUrl) void open(failedUrl);
    }, [failedUrl, open]);

    return { failedUrl, open, retry };
}
