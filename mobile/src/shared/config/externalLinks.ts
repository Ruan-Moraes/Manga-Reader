import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

export const EXTERNAL_LINK_KEYS = ['support', 'terms', 'privacy', 'project'] as const;

export type ExternalLinkKey = (typeof EXTERNAL_LINK_KEYS)[number];
export type ExternalLinks = Partial<Record<ExternalLinkKey, string>>;

export interface ExpoExternalLinksSource {
    expoConfig?: {
        extra?: Record<string, unknown>;
    } | null;
}

export class ExternalLinkError extends Error {
    constructor(
        public readonly code: 'invalid-url' | 'open-failed',
        options?: ErrorOptions,
    ) {
        super(code, options);
        this.name = 'ExternalLinkError';
    }
}

export function normalizeHttpsUrl(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
        return url.toString();
    } catch {
        return null;
    }
}

export function readConfiguredExternalLinks(source: ExpoExternalLinksSource = Constants): ExternalLinks {
    const configured = source.expoConfig?.extra?.externalLinks;
    if (!configured || typeof configured !== 'object' || Array.isArray(configured)) return {};

    return EXTERNAL_LINK_KEYS.reduce<ExternalLinks>((links, key) => {
        const url = normalizeHttpsUrl((configured as Record<string, unknown>)[key]);
        if (url) links[key] = url;
        return links;
    }, {});
}

export async function openConfiguredHttpsUrl(url: string, opener: (url: string) => Promise<unknown> = Linking.openURL): Promise<void> {
    const normalized = normalizeHttpsUrl(url);
    if (!normalized) throw new ExternalLinkError('invalid-url');

    try {
        await opener(normalized);
    } catch (cause) {
        throw new ExternalLinkError('open-failed', { cause });
    }
}

export const externalLinks = {
    read: (): ExternalLinks => readConfiguredExternalLinks(Constants),
    open: (url: string): Promise<void> => openConfiguredHttpsUrl(url, Linking.openURL),
};
