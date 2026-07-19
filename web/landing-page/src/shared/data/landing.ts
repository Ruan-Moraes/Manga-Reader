import type { IconName } from '@/shared/component/Icon';

/**
 * Dados estruturais (não-textuais) da landing: ids, ícones, gradientes e cores.
 * O texto visível vem sempre do i18n na MESMA ordem (por índice). Trocar os
 * arrays mockados por dados de API é trivial — basta manter as mesmas chaves.
 */

export interface CatalogItem {
    id: string;
    initial: string;
    title: string;
    genre: string;
    ch: number;
    rating: number;
    gradient: string;
    tag?: string;
}

export const CATALOG: CatalogItem[] = [
    {
        id: 'op',
        initial: 'OP',
        title: 'One Piece',
        genre: 'Shounen',
        ch: 1120,
        rating: 4.9,
        gradient: 'linear-gradient(135deg,#2a1f0f,#161616)',
        tag: 'EM ALTA',
    },
    {
        id: 'fr',
        initial: 'FR',
        title: 'Frieren',
        genre: 'Fantasia',
        ch: 140,
        rating: 4.9,
        gradient: 'linear-gradient(135deg,#1f3a2a,#161616)',
        tag: 'NOVO',
    },
    {
        id: 'sl',
        initial: 'SL',
        title: 'Solo Leveling',
        genre: 'Manhwa',
        ch: 200,
        rating: 4.8,
        gradient: 'linear-gradient(135deg,#1f2a3a,#161616)',
    },
    {
        id: 'cs',
        initial: 'CS',
        title: 'Chainsaw Man',
        genre: 'Dark',
        ch: 180,
        rating: 4.8,
        gradient: 'linear-gradient(135deg,#3a1010,#161616)',
        tag: 'HOJE',
    },
    {
        id: 'jk',
        initial: 'JK',
        title: 'Jujutsu Kaisen',
        genre: 'Sobrenatural',
        ch: 268,
        rating: 4.7,
        gradient: 'linear-gradient(135deg,#2a1f3a,#161616)',
    },
    {
        id: 'bk',
        initial: 'BK',
        title: 'Berserk',
        genre: 'Seinen',
        ch: 364,
        rating: 4.9,
        gradient: 'linear-gradient(135deg,#3a1f1f,#161616)',
    },
    {
        id: 'vm',
        initial: 'VS',
        title: 'Vinland Saga',
        genre: 'Histórico',
        ch: 214,
        rating: 4.9,
        gradient: 'linear-gradient(135deg,#1a2a3a,#161616)',
    },
    {
        id: 'dd',
        initial: 'DD',
        title: 'Dandadan',
        genre: 'Sobrenatural',
        ch: 182,
        rating: 4.8,
        gradient: 'linear-gradient(135deg,#3a1f2a,#161616)',
        tag: 'HOJE',
    },
    {
        id: 'mt',
        initial: 'MT',
        title: 'Mushoku Tensei',
        genre: 'Isekai',
        ch: 110,
        rating: 4.6,
        gradient: 'linear-gradient(135deg,#2a3a1f,#161616)',
    },
    {
        id: 'k8',
        initial: 'K8',
        title: 'Kaiju No. 8',
        genre: 'Ação',
        ch: 128,
        rating: 4.6,
        gradient: 'linear-gradient(135deg,#2a2a3a,#161616)',
    },
    {
        id: 'tg',
        initial: 'TG',
        title: 'Tokyo Ghoul',
        genre: 'Seinen',
        ch: 179,
        rating: 4.5,
        gradient: 'linear-gradient(135deg,#241624,#161616)',
    },
    {
        id: 'om',
        initial: 'OM',
        title: 'Omniscient Reader',
        genre: 'Manhwa',
        ch: 230,
        rating: 4.8,
        gradient: 'linear-gradient(135deg,#16242a,#161616)',
        tag: 'NOVO',
    },
];

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

export interface PlanMeta {
    accent: boolean;
    ribbon?: boolean;
}

export const PLANS_META: Record<
    'DAILY' | 'MONTHLY' | 'ANNUAL',
    PlanMeta
> = {
    DAILY: { accent: false },
    MONTHLY: { accent: true },
    ANNUAL: { accent: false, ribbon: true },
};

export interface TestimonialMeta {
    initials: string;
    color: string;
    rating: number;
}

export const TESTIMONIALS_META: TestimonialMeta[] = [
    { initials: 'AL', color: '#ddda2a', rating: 5 },
    { initials: 'CM', color: '#FF784F', rating: 5 },
    { initials: 'JS', color: '#cccccc', rating: 5 },
    { initials: 'RT', color: '#7fd1b9', rating: 4 },
];

export type CompareValue = 'yes' | 'no' | 'limited';

export interface CompareRow {
    free: CompareValue;
    premium: CompareValue;
}

export const COMPARE_ROWS: CompareRow[] = [
    { free: 'yes', premium: 'yes' },
    { free: 'yes', premium: 'no' },
    { free: 'no', premium: 'yes' },
    { free: 'limited', premium: 'yes' },
    { free: 'limited', premium: 'yes' },
    { free: 'yes', premium: 'yes' },
    { free: 'no', premium: 'yes' },
];

/* ---- Tipos auxiliares para leitura tipada do i18n (returnObjects) ---- */

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

export interface PlanView {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
}

export interface GiftStep {
    t: string;
    d: string;
}

export interface TestimonialText {
    name: string;
    role: string;
    text: string;
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
