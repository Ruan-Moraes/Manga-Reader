import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptCommon from './locales/pt-BR/common.json';
import ptAuth from './locales/pt-BR/auth.json';
import ptUser from './locales/pt-BR/user.json';
import ptManga from './locales/pt-BR/manga.json';
import ptComment from './locales/pt-BR/comment.json';
import ptNews from './locales/pt-BR/news.json';
import ptCategory from './locales/pt-BR/category.json';
import ptRating from './locales/pt-BR/rating.json';
import ptForum from './locales/pt-BR/forum.json';
import ptGroup from './locales/pt-BR/group.json';
import ptEvent from './locales/pt-BR/event.json';
import ptAdmin from './locales/pt-BR/admin.json';
import ptContact from './locales/pt-BR/contact.json';
import ptLibrary from './locales/pt-BR/library.json';
import ptStore from './locales/pt-BR/store.json';
import ptLayout from './locales/pt-BR/layout.json';

import enCommon from './locales/en-US/common.json';
import enAuth from './locales/en-US/auth.json';
import enUser from './locales/en-US/user.json';
import enManga from './locales/en-US/manga.json';
import enComment from './locales/en-US/comment.json';
import enNews from './locales/en-US/news.json';
import enCategory from './locales/en-US/category.json';
import enRating from './locales/en-US/rating.json';
import enForum from './locales/en-US/forum.json';
import enGroup from './locales/en-US/group.json';
import enEvent from './locales/en-US/event.json';
import enAdmin from './locales/en-US/admin.json';
import enContact from './locales/en-US/contact.json';
import enLibrary from './locales/en-US/library.json';
import enStore from './locales/en-US/store.json';
import enLayout from './locales/en-US/layout.json';

import esCommon from './locales/es-ES/common.json';
import esAuth from './locales/es-ES/auth.json';
import esUser from './locales/es-ES/user.json';
import esManga from './locales/es-ES/manga.json';
import esComment from './locales/es-ES/comment.json';
import esNews from './locales/es-ES/news.json';
import esCategory from './locales/es-ES/category.json';
import esRating from './locales/es-ES/rating.json';
import esForum from './locales/es-ES/forum.json';
import esGroup from './locales/es-ES/group.json';
import esEvent from './locales/es-ES/event.json';
import esAdmin from './locales/es-ES/admin.json';
import esContact from './locales/es-ES/contact.json';
import esLibrary from './locales/es-ES/library.json';
import esStore from './locales/es-ES/store.json';
import esLayout from './locales/es-ES/layout.json';

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES'] as const;
export const DEFAULT_LANGUAGE = 'pt-BR';

export const NAMESPACES = [
    'common',
    'layout',
    'auth',
    'user',
    'manga',
    'comment',
    'news',
    'category',
    'rating',
    'forum',
    'group',
    'event',
    'admin',
    'contact',
    'library',
    'store',
] as const;

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            'pt-BR': {
                common: ptCommon,
                layout: ptLayout,
                auth: ptAuth,
                user: ptUser,
                manga: ptManga,
                comment: ptComment,
                news: ptNews,
                category: ptCategory,
                rating: ptRating,
                forum: ptForum,
                group: ptGroup,
                event: ptEvent,
                admin: ptAdmin,
                contact: ptContact,
                library: ptLibrary,
                store: ptStore,
            },
            'en-US': {
                common: enCommon,
                layout: enLayout,
                auth: enAuth,
                user: enUser,
                manga: enManga,
                comment: enComment,
                news: enNews,
                category: enCategory,
                rating: enRating,
                forum: enForum,
                group: enGroup,
                event: enEvent,
                admin: enAdmin,
                contact: enContact,
                library: enLibrary,
                store: enStore,
            },
            'es-ES': {
                common: esCommon,
                layout: esLayout,
                auth: esAuth,
                user: esUser,
                manga: esManga,
                comment: esComment,
                news: esNews,
                category: esCategory,
                rating: esRating,
                forum: esForum,
                group: esGroup,
                event: esEvent,
                admin: esAdmin,
                contact: esContact,
                library: esLibrary,
                store: esStore,
            },
        },
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES,
        defaultNS: 'common',
        ns: NAMESPACES,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
    });

export default i18n;
