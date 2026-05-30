export type ProfileData = {
    handle: string;
    name: string;
    bio: string;
    verified: boolean;
    worksRead: number;
    reviews: number;
    followers: number;
    following: number;
    genres: string[];
    isOwn?: boolean;
};

export const PROFILES: Record<string, ProfileData> = {
    me: {
        handle: '@leitor_br',
        name: 'Leitor BR',
        verified: false,
        isOwn: true,
        bio: 'Leitor ávido de mangás desde 2010. Especializado em Seinen e Dark Fantasy. Berserk é vida.',
        worksRead: 84,
        reviews: 27,
        followers: 312,
        following: 58,
        genres: ['Seinen', 'Dark Fantasy', 'Ação', 'Shounen'],
    },
    darkfan92: {
        handle: '@darkfan92',
        name: 'darkfan92',
        verified: false,
        bio: 'Fã de Berserk e Vagabond. Leitor desde 2008.',
        worksRead: 142,
        reviews: 63,
        followers: 890,
        following: 124,
        genres: ['Seinen', 'Histórico'],
    },
};

export const READING_NOW = [
    {
        id: '1',
        title: 'Berserk',
        author: 'K. Miura',
        rating: 4.9,
        chapter: 370,
        status: 'reading' as const,
        progress: 78,
    },
    {
        id: '6',
        title: 'Chainsaw Man',
        author: 'T. Fujimoto',
        rating: 4.7,
        chapter: 168,
        status: 'reading' as const,
        progress: 32,
    },
    {
        id: '12',
        title: 'Frieren',
        author: 'K. Yamada',
        rating: 4.9,
        chapter: 120,
        status: 'reading' as const,
        progress: 55,
    },
];

export const COMPLETED = [
    {
        id: '3',
        title: 'Attack on Titan',
        author: 'H. Isayama',
        rating: 4.9,
        chapter: 139,
        status: 'completed' as const,
    },
    {
        id: '4',
        title: 'Fullmetal Alch.',
        author: 'H. Arakawa',
        rating: 4.9,
        chapter: 108,
        status: 'completed' as const,
    },
    {
        id: '7',
        title: 'Vinland Saga',
        author: 'M. Yukimura',
        rating: 4.8,
        chapter: 210,
        status: 'completed' as const,
    },
    {
        id: '9',
        title: 'Dungeon Meshi',
        author: 'R. Kui',
        rating: 4.8,
        chapter: 97,
        status: 'completed' as const,
    },
    {
        id: '10',
        title: 'Death Note',
        author: 'T. Ohba',
        rating: 4.8,
        chapter: 108,
        status: 'completed' as const,
    },
];

export const REVIEWS = [
    {
        author: {
            name: 'leitor_br',
            handle: '@leitor_br',
            badge: undefined as undefined,
        },
        when: 'há 3 dias',
        rating: 5,
        title: 'A obra-prima definitiva',
        body: 'Berserk é, sem sombra de dúvida, o mangá mais bem escrito de todos os tempos.',
        upvotes: 892,
        badge: 'top' as const,
        manga: { id: '1', title: 'Berserk' },
    },
    {
        author: {
            name: 'leitor_br',
            handle: '@leitor_br',
            badge: undefined as undefined,
        },
        when: 'há 2 semanas',
        rating: 4,
        title: 'Épico e necessário',
        body: 'Vinland Saga traz uma reflexão profunda sobre guerra e redenção.',
        upvotes: 234,
        badge: null as null,
        manga: { id: '7', title: 'Vinland Saga' },
    },
];

export const GROUPS_FOLLOWED = [
    {
        id: '1',
        name: 'Scan Brasileiro',
        handle: '@scan-br',
        status: 'active' as const,
        verified: true,
        members: 1240,
        projects: 58,
        chaptersPublished: 3400,
    },
    {
        id: '7',
        name: 'Wonder Scans',
        handle: '@wonder',
        status: 'active' as const,
        verified: true,
        members: 1890,
        projects: 41,
        chaptersPublished: 2700,
    },
];

export const ACTIVITY = [
    { text: 'Leu o capítulo 370 de Berserk', when: 'há 2h' },
    { text: 'Publicou uma resenha de Vinland Saga', when: 'há 2 semanas' },
    { text: 'Marcou Attack on Titan como concluído', when: 'há 1 mês' },
    { text: 'Passou a seguir Wonder Scans', when: 'há 2 meses' },
];
