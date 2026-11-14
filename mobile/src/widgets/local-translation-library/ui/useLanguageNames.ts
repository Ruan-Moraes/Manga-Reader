import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/** Localized language names for the library rows and the work summary ("Japonês → Português (Brasil)"), code as fallback. */
export function useLanguageNames() {
    const { t } = useTranslation('launcher');
    const name = useCallback((code: string) => t(`offline.languages.options.${code}`, { defaultValue: code }), [t]);
    const pair = useCallback((source: string, target: string) => `${name(source)} → ${name(target)}`, [name]);
    return { name, pair };
}
