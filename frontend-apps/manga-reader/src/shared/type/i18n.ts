/**
 * Tipos compartilhados para conteúdo multilíngue (i18n de domínio).
 *
 * Catálogo/admin: backend persiste como JSONB; DTO admin expõe como `LocalizedString`.
 * DTO público recebe `string` já resolvido pelo locale do request.
 */

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'] as const;
export type LanguageTag = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageTag = 'pt-BR';

/** Mapa BCP 47 → texto. `pt-BR` é fallback obrigatório no backend. */
export type LocalizedString = Partial<Record<LanguageTag, string>>;

/** Variante para listas (ex.: `features[]`, `content[]`). */
export type LocalizedStringList = Partial<Record<LanguageTag, string[]>>;

/**
 * Resolve um `LocalizedString` para string exibível: tenta o idioma pedido,
 * cai para `pt-BR` e por fim para o primeiro valor disponível.
 */
export const resolveLocalized = (value: LocalizedString | string | undefined | null, lang?: string): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;

    const tag = (lang ?? '').split('-')[0];
    const match = SUPPORTED_LANGUAGES.find(l => l === lang || l.startsWith(tag));

    return (match && value[match]) ?? value[DEFAULT_LANGUAGE] ?? Object.values(value)[0] ?? '';
};
