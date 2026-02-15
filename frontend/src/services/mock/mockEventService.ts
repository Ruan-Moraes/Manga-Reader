import { EventType, EventTypes } from '../../types/EventTypes';

type EventFilters = {
    tab: 'upcoming' | 'ongoing' | 'past' | 'my-events';
    query: string;
    type: 'all' | EventType;
    period: 'all' | 'today' | 'week' | 'month';
    sort: 'date' | 'popularity' | 'relevance';
    isLoggedIn: boolean;
};

const now = new Date();

const addDays = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

export const mockEvents: EventTypes[] = [
    {
        id: 'ev-1',
        title: 'AnimeCon 2024',
        subtitle: 'A maior convenção geek da temporada',
        description:
            'Três dias de painéis, campeonatos de cosplay, lojas oficiais, artist alley e encontros com dubladores e autores convidados.',
        image: 'https://picsum.photos/1200/520?random=401',
        gallery: [
            'https://picsum.photos/400/260?random=411',
            'https://picsum.photos/400/260?random=412',
        ],
        startDate: addDays(10),
        endDate: addDays(13),
        timezone: 'GMT-3',
        timeline: 'upcoming',
        status: 'registrations_open',
        type: 'Convenção',
        location: {
            label: 'Expo Center Norte',
            address: 'Rua José Bernardo Pinto, 333',
            city: 'São Paulo - SP',
            isOnline: false,
            mapLink: 'https://maps.google.com',
            directions:
                'Próximo à estação Portuguesa-Tietê e com estacionamento no local.',
        },
        organizer: {
            id: 'org-1',
            name: 'AnimeCon Brasil',
            avatar: 'https://i.pravatar.cc/120?img=39',
            profileLink: '/groups/g-1',
            contact: 'contato@animecon.com.br',
        },
        priceLabel: 'A partir de R$ 90',
        participants: 192,
        interested: 240,
        isFeatured: true,
        isCreatedByMe: true,
        amIParticipating: true,
        schedule: [
            'Dia 1: abertura + painéis',
            'Dia 2: concurso de cosplay',
            'Dia 3: finais e meet & greet',
        ],
        specialGuests: [
            'Yumi Takahashi',
            'Studio Kaze',
            'Dublador Rafael Moreira',
        ],
        tickets: [
            {
                id: 't1',
                name: 'Inteira diária',
                price: 'R$ 90',
                available: 120,
            },
            {
                id: 't2',
                name: 'Passaporte 3 dias',
                price: 'R$ 220',
                available: 58,
            },
            { id: 't3', name: 'VIP', price: 'R$ 390', available: 18 },
        ],
        socialLinks: {
            instagram: '@animeconbr',
            website: 'https://animecon.com.br',
        },
        comments: [
            {
                id: 'c1',
                user: 'Mika',
                message: 'Vai ter palco para bandas?',
                createdAt: addDays(-1),
            },
            {
                id: 'c2',
                user: 'Kenji',
                message: 'Já garanti o passaporte!',
                createdAt: addDays(-2),
            },
        ],
        relatedEventIds: ['ev-2', 'ev-9', 'ev-13'],
    },
    {
        id: 'ev-2',
        title: 'Noite de Autógrafos - Mangá X',
        subtitle: 'Sessão com artista convidado e brindes limitados',
        description:
            'Evento gratuito com bate-papo, sessão de autógrafos e venda de edição especial com marcador colecionável.',
        image: 'https://picsum.photos/1200/520?random=402',
        gallery: [
            'https://picsum.photos/400/260?random=413',
            'https://picsum.photos/400/260?random=414',
        ],
        startDate: addDays(4),
        endDate: addDays(4),
        timezone: 'GMT-3',
        timeline: 'upcoming',
        status: 'coming_soon',
        type: 'Lançamento',
        location: {
            label: 'Livraria Neko',
            address: 'Av. Paulista, 1000',
            city: 'São Paulo - SP',
            isOnline: false,
            mapLink: 'https://maps.google.com',
            directions: 'Auditório no 2º andar, acesso por elevador lateral.',
        },
        organizer: {
            id: 'org-2',
            name: 'Editora Nami',
            avatar: 'https://i.pravatar.cc/120?img=41',
            profileLink: '/groups/g-2',
            contact: 'eventos@editoranami.com',
        },
        priceLabel: 'Gratuito',
        participants: 82,
        interested: 137,
        amIParticipating: false,
        isSaved: true,
        schedule: ['19h: abertura', '19h30: bate-papo', '20h: autógrafos'],
        specialGuests: ['Akira Sato'],
        tickets: [
            { id: 't4', name: 'Entrada geral', price: 'Grátis', available: 60 },
        ],
        socialLinks: { instagram: '@editoranami' },
        comments: [
            {
                id: 'c3',
                user: 'Luna',
                message: 'Chegar cedo para pegar senha.',
                createdAt: addDays(-1),
            },
        ],
        relatedEventIds: ['ev-1', 'ev-7', 'ev-9'],
    },
    {
        id: 'ev-3',
        title: 'Bate-papo com tradutores',
        subtitle: 'Live ao vivo no YouTube com convidados',
        description:
            'Discussão sobre adaptação cultural, fluxos de revisão e curiosidades do mercado de tradução de mangás.',
        image: 'https://picsum.photos/1200/520?random=403',
        gallery: ['https://picsum.photos/400/260?random=415'],
        startDate: addDays(0),
        endDate: addDays(0),
        timezone: 'GMT-3',
        timeline: 'ongoing',
        status: 'happening_now',
        type: 'Live',
        location: {
            label: 'Online',
            address: 'Canal Manga Reader no YouTube',
            city: 'Online',
            isOnline: true,
            mapLink: 'https://youtube.com',
            directions: 'Ative o lembrete no YouTube para receber notificação.',
        },
        organizer: {
            id: 'org-3',
            name: 'Comunidade Manga Reader',
            avatar: 'https://i.pravatar.cc/120?img=47',
            profileLink: '/groups/g-3',
            contact: 'comunidade@mangareader.gg',
        },
        priceLabel: 'Gratuito',
        participants: 160,
        interested: 196,
        amIParticipating: true,
        schedule: [
            '20h: abertura',
            '20h10: mesa redonda',
            '21h: perguntas da comunidade',
        ],
        specialGuests: ['Sofia K.', 'Ryu Min'],
        tickets: [
            { id: 't5', name: 'Acesso live', price: 'Grátis', available: 999 },
        ],
        socialLinks: { twitter: '@mangareader' },
        comments: [
            {
                id: 'c4',
                user: 'Pedro',
                message: 'Tema excelente!',
                createdAt: addDays(0),
            },
        ],
        relatedEventIds: ['ev-8', 'ev-11'],
    },
    {
        id: 'ev-4',
        title: 'Como desenhar mangá',
        subtitle: 'Workshop prático com vagas limitadas',
        description:
            'Aula prática com foco em construção de personagens, narrativa visual e finalização para web.',
        image: 'https://picsum.photos/1200/520?random=404',
        gallery: ['https://picsum.photos/400/260?random=416'],
        startDate: addDays(8),
        endDate: addDays(8),
        timezone: 'GMT-3',
        timeline: 'upcoming',
        status: 'registrations_open',
        type: 'Workshop',
        location: {
            label: 'Estúdio Traço',
            address: 'Rua Aurora, 223',
            city: 'Curitiba - PR',
            isOnline: false,
            mapLink: 'https://maps.google.com',
            directions: 'Levar sketchbook e materiais próprios.',
        },
        organizer: {
            id: 'org-4',
            name: 'Coletivo Traço',
            avatar: 'https://i.pravatar.cc/120?img=24',
            profileLink: '/groups/g-4',
            contact: 'oficina@traco.art',
        },
        priceLabel: 'A partir de R$ 120',
        participants: 45,
        interested: 98,
        isCreatedByMe: true,
        schedule: [
            '10h: fundamentos',
            '13h: prática guiada',
            '16h: feedback em grupo',
        ],
        specialGuests: ['Mestre Nori'],
        tickets: [
            { id: 't6', name: 'Turma única', price: 'R$ 120', available: 12 },
        ],
        socialLinks: { instagram: '@coletivotraco' },
        comments: [
            {
                id: 'c5',
                user: 'Ana',
                message: 'Ainda tem vaga?',
                createdAt: addDays(-3),
            },
        ],
        relatedEventIds: ['ev-5', 'ev-10'],
    },
    {
        id: 'ev-5',
        title: 'Encontro de colecionadores',
        subtitle: 'Troca de experiências e itens raros',
        description:
            'Meetup em café temático para networking, trocas e exposição de coleções.',
        image: 'https://picsum.photos/1200/520?random=405',
        gallery: ['https://picsum.photos/400/260?random=417'],
        startDate: addDays(-1),
        endDate: addDays(0),
        timezone: 'GMT-3',
        timeline: 'ongoing',
        status: 'happening_now',
        type: 'Meetup',
        location: {
            label: 'Café Otaku Corner',
            address: 'Rua da Paz, 50',
            city: 'Belo Horizonte - MG',
            isOnline: false,
            mapLink: 'https://maps.google.com',
            directions: 'Mesa reservada no mezanino.',
        },
        organizer: {
            id: 'org-5',
            name: 'Colecionadores BR',
            avatar: 'https://i.pravatar.cc/120?img=28',
            profileLink: '/groups/g-5',
            contact: 'contato@colecionadoresbr.com',
        },
        priceLabel: 'Consulte',
        participants: 67,
        interested: 80,
        amIParticipating: true,
        schedule: ['14h: boas-vindas', '15h: rodada de troca', '17h: sorteio'],
        specialGuests: ['Lojista Kitsu'],
        tickets: [
            {
                id: 't7',
                name: 'Entrada',
                price: 'R$ 20 consumíveis',
                available: 34,
            },
        ],
        socialLinks: { instagram: '@colecionadoresbr' },
        comments: [
            {
                id: 'c6',
                user: 'Téo',
                message: 'Levem suas listas de troca!',
                createdAt: addDays(-1),
            },
        ],
        relatedEventIds: ['ev-4', 'ev-9'],
    },
    ...Array.from({ length: 8 }).map((_, index) => ({
        id: `ev-${index + 6}`,
        title: `Evento da Comunidade #${index + 1}`,
        subtitle: 'Atividade temática de mangás e cultura pop',
        description:
            'Evento especial com debates, desafios e integração da comunidade.',
        image: `https://picsum.photos/1200/520?random=${430 + index}`,
        gallery: [`https://picsum.photos/400/260?random=${450 + index}`],
        startDate: addDays(index - 6),
        endDate: addDays(index - 6),
        timezone: 'GMT-3',
        timeline: index < 3 ? 'past' : index < 5 ? 'ongoing' : 'upcoming',
        status:
            index < 3 ? 'ended' : index < 5 ? 'happening_now' : 'coming_soon',
        type: (
            [
                'Convenção',
                'Lançamento',
                'Live',
                'Workshop',
                'Meetup',
            ] as EventType[]
        )[index % 5],
        location: {
            label: index % 2 === 0 ? 'Online' : 'Centro Cultural Nippon',
            address:
                index % 2 === 0
                    ? 'Discord oficial Manga Reader'
                    : 'Av. Central, 700',
            city: index % 2 === 0 ? 'Online' : 'Rio de Janeiro - RJ',
            isOnline: index % 2 === 0,
            mapLink: 'https://maps.google.com',
            directions: 'Informações enviadas por e-mail após inscrição.',
        },
        organizer: {
            id: `org-extra-${index}`,
            name: `Organizador ${index + 1}`,
            avatar: `https://i.pravatar.cc/120?img=${50 + index}`,
            profileLink: '/profile',
            contact: 'organizador@mangareader.gg',
        },
        priceLabel:
            index % 3 === 0 ? 'Gratuito' : `A partir de R$ ${30 + index * 5}`,
        participants: 30 + index * 18,
        interested: 70 + index * 14,
        isCreatedByMe: index === 1,
        amIParticipating: index % 2 === 0,
        isSaved: index % 3 === 0,
        schedule: ['Programação divulgada em breve'],
        specialGuests: ['Convidado surpresa'],
        tickets: [
            {
                id: `tk-${index}`,
                name: 'Ingresso padrão',
                price: 'Consulte',
                available: 100 - index * 4,
            },
        ],
        socialLinks: {},
        comments: [
            {
                id: `cx-${index}`,
                user: 'Usuário da comunidade',
                message: 'Ansioso para participar!',
                createdAt: addDays(-index),
            },
        ],
        relatedEventIds: ['ev-1', 'ev-2', 'ev-3'],
    })),
];

export const getEventById = (id: string) =>
    mockEvents.find(event => event.id === id);

export const getRelatedEvents = (event: EventTypes) =>
    mockEvents
        .filter(item => event.relatedEventIds.includes(item.id))
        .slice(0, 4);

export const filterEvents = ({
    tab,
    query,
    type,
    period,
    sort,
    isLoggedIn,
}: EventFilters) => {
    const normalizedQuery = query.trim().toLowerCase();

    const byTab = mockEvents.filter(event => {
        if (tab === 'my-events') {
            return (
                isLoggedIn &&
                (event.isCreatedByMe || event.amIParticipating || event.isSaved)
            );
        }

        return event.timeline === tab;
    });

    const byQuery = byTab.filter(event => {
        const haystack =
            `${event.title} ${event.location.label} ${event.location.city}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });

    const byType =
        type === 'all' ? byQuery : byQuery.filter(event => event.type === type);

    const byPeriod = byType.filter(event => {
        if (period === 'all') return true;

        const eventDate = new Date(event.startDate).getTime();
        const nowDate = now.getTime();

        if (period === 'today') {
            return (
                new Date(event.startDate).toDateString() === now.toDateString()
            );
        }

        if (period === 'week') {
            return eventDate >= nowDate && eventDate <= nowDate + 7 * 86400000;
        }

        return eventDate >= nowDate && eventDate <= nowDate + 31 * 86400000;
    });

    return [...byPeriod].sort((a, b) => {
        if (sort === 'date') {
            return (
                new Date(a.startDate).getTime() -
                new Date(b.startDate).getTime()
            );
        }

        if (sort === 'popularity') {
            return (
                b.participants + b.interested - (a.participants + a.interested)
            );
        }

        const aRelevance =
            Number(a.isFeatured) + Number(a.amIParticipating) + a.interested;
        const bRelevance =
            Number(b.isFeatured) + Number(b.amIParticipating) + b.interested;
        return bRelevance - aRelevance;
    });
};

export const eventTypes: EventType[] = [
    'Convenção',
    'Lançamento',
    'Live',
    'Workshop',
    'Meetup',
];

export const statusLabel: Record<EventTypes['status'], string> = {
    happening_now: 'Acontecendo Agora',
    registrations_open: 'Inscrições Abertas',
    coming_soon: 'Em Breve',
    ended: 'Encerrado',
};
