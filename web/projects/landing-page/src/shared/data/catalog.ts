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
