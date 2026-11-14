import { useTranslation } from 'react-i18next';

/**
 * Retorna o código do idioma ativo (ex: 'pt-BR', 'en-US', 'es-ES').
 */
export function useLocale(): string {
    const { i18n } = useTranslation();
    return i18n.resolvedLanguage ?? i18n.language ?? 'pt-BR';
}
