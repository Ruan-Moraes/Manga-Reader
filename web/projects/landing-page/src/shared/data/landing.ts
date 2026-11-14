import type { IconName } from '@/shared/component/Icon';

/* Re-exports por domínio para 100% de compatibilidade retroativa */
export * from './catalog';
export * from './plans';
export * from './compare';
export * from './testimonials';
export * from './translation';

/** Ícones dos benefícios — texto vem de `benefits.items` na mesma ordem. */
export const BENEFITS_META: IconName[] = [
    'library',
    'calendar',
    'hd',
    'wifiOff',
    'sync',
    'devices',
    'noAds',
    'heart',
    'download',
    'smartphone',
    'globe',
];

/** Ícones das estatísticas — texto vem de `stats.items` na mesma ordem. */
export const STATS_META: IconName[] = [
    'library',
    'layers',
    'users',
    'zap',
    'devices',
];

/* ---- Tipos gerais para leitura tipada do i18n (returnObjects) ---- */

export interface LandingUi {
    searchPlaceholder: string;
    continueReading: string;
    forYou: string;
    trending: string;
    chapters: string;
    chapter: string;
    readNow: string;
    addLibrary: string;
    reading: string;
    synced: string;
    myLibrary: string;
    tabsLib: string[];
    page: string;
    of: string;
    completed: string;
    online: string;
}

export interface BenefitText {
    t: string;
    d: string;
}

export interface GiftStep {
    t: string;
    d: string;
}

export interface FaqText {
    q: string;
    a: string;
}

export interface StatText {
    value: string;
    label: string;
}

export interface LandingMock {
    synopsis: string;
    ago: string[];
    profileName: string;
    statReading: string;
    statCompleted: string;
    statAvg: string;
}
