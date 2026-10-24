const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

export const toSafeExternalUrl = (value?: string | null): string | null => {
    if (!value) return null;

    try {
        const url = new URL(value);
        return SAFE_PROTOCOLS.has(url.protocol) ? url.toString() : null;
    } catch {
        return null;
    }
};
