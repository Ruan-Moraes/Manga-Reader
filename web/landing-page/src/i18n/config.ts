import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR/translation.json';
import enUS from './locales/en-US/translation.json';
import esES from './locales/es-ES/translation.json';

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            'pt-BR': { translation: ptBR },
            'en-US': { translation: enUS },
            'es-ES': { translation: esES },
        },
        fallbackLng: 'pt-BR',
        supportedLngs: ['pt-BR', 'en-US', 'es-ES'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
