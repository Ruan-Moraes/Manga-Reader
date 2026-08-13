import type { SupportedLanguage } from '@/src/shared/i18n';

export const SUPPORTED_CONTENT_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'] as const;

export type ContentLanguage = (typeof SUPPORTED_CONTENT_LANGUAGES)[number];
export type ContentLanguageChain = ContentLanguage[];

const supported = new Set<string>(SUPPORTED_CONTENT_LANGUAGES);

export function isContentLanguage(value: unknown): value is ContentLanguage {
    return typeof value === 'string' && supported.has(value);
}

export function normalizeContentLanguages(value: unknown): ContentLanguageChain {
    const source = Array.isArray(value) ? value : [];
    const normalized = source.filter(isContentLanguage).filter((locale, index, locales) => locales.indexOf(locale) === index);

    if (!normalized.includes('pt-BR')) normalized.push('pt-BR');

    return normalized;
}

export function deriveGuestContentLanguages(language: SupportedLanguage): ContentLanguageChain {
    return language === 'pt-BR' ? ['pt-BR'] : [language, 'pt-BR'];
}

export function addContentLanguage(chain: readonly ContentLanguage[], language: ContentLanguage): ContentLanguageChain {
    return normalizeContentLanguages([...chain, language]);
}

export function removeContentLanguage(chain: readonly ContentLanguage[], language: ContentLanguage): ContentLanguageChain {
    if (language === 'pt-BR') return normalizeContentLanguages(chain);
    return normalizeContentLanguages(chain.filter(candidate => candidate !== language));
}

export function moveContentLanguage(chain: readonly ContentLanguage[], from: number, to: number): ContentLanguageChain {
    const normalized = normalizeContentLanguages(chain);
    if (from < 0 || from >= normalized.length || to < 0 || to >= normalized.length || from === to) return normalized;

    const moved = [...normalized];
    const [language] = moved.splice(from, 1);
    moved.splice(to, 0, language);
    return moved;
}
