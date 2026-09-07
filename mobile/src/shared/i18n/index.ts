import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { brand } from '../config/brand.generated';

import enUSAuth from './locales/en-US/auth.json';
import enUSCommon from './locales/en-US/common.json';
import enUSLauncher from './locales/en-US/launcher.json';
import enUSReader from './locales/en-US/reader.json';
import enUSRemoteProcessing from './locales/en-US/remoteProcessing.json';
import enUSSettingsNavigation from './locales/en-US/settingsNavigation.json';
import esESAuth from './locales/es-ES/auth.json';
import esESCommon from './locales/es-ES/common.json';
import esESLauncher from './locales/es-ES/launcher.json';
import esESReader from './locales/es-ES/reader.json';
import esESRemoteProcessing from './locales/es-ES/remoteProcessing.json';
import esESSettingsNavigation from './locales/es-ES/settingsNavigation.json';
import ptBRAuth from './locales/pt-BR/auth.json';
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRLauncher from './locales/pt-BR/launcher.json';
import ptBRReader from './locales/pt-BR/reader.json';
import ptBRRemoteProcessing from './locales/pt-BR/remoteProcessing.json';
import ptBRSettingsNavigation from './locales/pt-BR/settingsNavigation.json';

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'pt-BR';

export const NAMESPACES = ['common', 'auth', 'launcher', 'reader', 'remoteProcessing', 'settingsNavigation'] as const;

const resources = {
    'pt-BR': {
        common: ptBRCommon,
        auth: ptBRAuth,
        launcher: ptBRLauncher,
        reader: ptBRReader,
        remoteProcessing: ptBRRemoteProcessing,
        settingsNavigation: ptBRSettingsNavigation,
    },
    'en-US': {
        common: enUSCommon,
        auth: enUSAuth,
        launcher: enUSLauncher,
        reader: enUSReader,
        remoteProcessing: enUSRemoteProcessing,
        settingsNavigation: enUSSettingsNavigation,
    },
    'es-ES': {
        common: esESCommon,
        auth: esESAuth,
        launcher: esESLauncher,
        reader: esESReader,
        remoteProcessing: esESRemoteProcessing,
        settingsNavigation: esESSettingsNavigation,
    },
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
        defaultVariables: { brandName: brand.name },
    },
    compatibilityJSON: 'v4',
});

export function isSupportedLanguage(language: string | null | undefined): language is SupportedLanguage {
    return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

export function normalizeInterfaceLanguage(language: unknown): SupportedLanguage {
    return typeof language === 'string' && isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
}

export function getCurrentLanguage(): SupportedLanguage {
    return normalizeInterfaceLanguage(i18n.language);
}

export default i18n;
