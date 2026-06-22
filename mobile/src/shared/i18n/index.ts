import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUSAuth from './locales/en-US/auth.json';
import enUSCommon from './locales/en-US/common.json';
import esESAuth from './locales/es-ES/auth.json';
import esESCommon from './locales/es-ES/common.json';
import ptBRAuth from './locales/pt-BR/auth.json';
import ptBRCommon from './locales/pt-BR/common.json';

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-BR';

export const NAMESPACES = ['common', 'auth'] as const;

const resources = {
    'pt-BR': { common: ptBRCommon, auth: ptBRAuth },
    'en-US': { common: enUSCommon, auth: enUSAuth },
    'es-ES': { common: esESCommon, auth: esESAuth },
};

i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: NAMESPACES,
    interpolation: {
        // React already escapes values
        escapeValue: false,
    },
    compatibilityJSON: 'v4',
});

export function isSupportedLanguage(language: string | null | undefined): language is SupportedLanguage {
    return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

export function getCurrentLanguage(): SupportedLanguage {
    return isSupportedLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

export default i18n;
