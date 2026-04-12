import type {
    EventComment,
    EventData,
    EventStatus,
    EventTimeline,
    EventType,
    TicketType,
} from '@feature/event/type/event.types';

let eventCounter = 0;
let ticketCounter = 0;
let eventCommentCounter = 0;

const ALL_EVENT_STATUSES: EventStatus[] = [
    'happening_now',
    'registrations_open',
    'coming_soon',
    'ended',
];

const ALL_EVENT_TIMELINES: EventTimeline[] = ['upcoming', 'ongoing', 'past'];

const ALL_EVENT_TYPES: EventType[] = [
    'Convenção',
    'Lançamento',
    'Live',
    'Workshop',
    'Meetup',
];

export const buildTicketType = (
    overrides: Partial<TicketType> = {},
): TicketType => {
    ticketCounter += 1;

    return {
        id: `ticket-${ticketCounter}`,
        name: `Ingresso ${ticketCounter}`,
        price: 'R$ 50,00',
        available: 100,
        ...overrides,
    };
};

export const ticketTypePresets = {
    free: () => buildTicketType({ price: 'Grátis', name: 'Entrada Gratuita' }),
    cheap: () => buildTicketType({ price: 'R$ 10,00', available: 500 }),
    vip: () => buildTicketType({ price: 'R$ 500,00', available: 20 }),
    soldOut: () => buildTicketType({ available: 0 }),
};

export const buildEventComment = (
    overrides: Partial<EventComment> = {},
): EventComment => {
    eventCommentCounter += 1;

    return {
        id: `event-comment-${eventCommentCounter}`,
        user: `Usuario ${eventCommentCounter}`,
        message: `Mensagem do comentario ${eventCommentCounter}.`,
        createdAt: '2026-03-15T10:00:00Z',
        ...overrides,
    };
};

export const buildEventData = (
    overrides: Partial<EventData> = {},
): EventData => {
    eventCounter += 1;

    return {
        id: `event-${eventCounter}`,
        title: `Evento Teste ${eventCounter}`,
        subtitle: `Subtitulo ${eventCounter}`,
        description: 'Descricao detalhada do evento.',
        image: `/events/event-${eventCounter}.jpg`,
        gallery: [],
        startDate: '2026-05-15T10:00:00Z',
        endDate: '2026-05-17T22:00:00Z',
        timezone: 'America/Sao_Paulo',
        timeline: 'upcoming',
        status: 'registrations_open',
        type: 'Convenção',
        location: {
            label: 'Centro de Convencoes',
            address: 'Rua Teste, 123',
            city: 'Sao Paulo',
            isOnline: false,
            mapLink: 'https://maps.example.com',
            directions: 'Proximo ao metro Centro.',
        },
        organizer: {
            id: `org-${eventCounter}`,
            name: 'Organizador Teste',
            avatar: '/avatars/org.png',
            profileLink: '/users/org',
            contact: 'contato@org.com',
        },
        priceLabel: 'R$ 50,00',
        participants: 250,
        interested: 1000,
        isFeatured: false,
        isCreatedByMe: false,
        amIParticipating: false,
        isSaved: false,
        schedule: ['10:00 - Abertura', '14:00 - Painel principal'],
        specialGuests: ['Convidado A', 'Convidado B'],
        tickets: [],
        socialLinks: {},
        comments: [],
        relatedEventIds: [],
        ...overrides,
    };
};

export const eventDataPresets = {
    happeningNow: () =>
        buildEventData({ status: 'happening_now', timeline: 'ongoing' }),
    registrationsOpen: () =>
        buildEventData({ status: 'registrations_open', timeline: 'upcoming' }),
    comingSoon: () =>
        buildEventData({ status: 'coming_soon', timeline: 'upcoming' }),
    ended: () => buildEventData({ status: 'ended', timeline: 'past' }),

    convencao: () => buildEventData({ type: 'Convenção' }),
    lancamento: () => buildEventData({ type: 'Lançamento' }),
    live: () =>
        buildEventData({
            type: 'Live',
            location: {
                label: 'Online',
                address: '',
                city: '',
                isOnline: true,
                mapLink: '',
                directions: '',
            },
        }),
    workshop: () => buildEventData({ type: 'Workshop' }),
    meetup: () => buildEventData({ type: 'Meetup' }),

    online: () =>
        buildEventData({
            location: {
                label: 'Plataforma Online',
                address: '',
                city: '',
                isOnline: true,
                mapLink: '',
                directions: 'Link enviado por email.',
            },
        }),

    presencial: () => buildEventData({}),

    withTickets: () =>
        buildEventData({
            tickets: [
                ticketTypePresets.free(),
                ticketTypePresets.cheap(),
                ticketTypePresets.vip(),
            ],
        }),
    soldOut: () => buildEventData({ tickets: [ticketTypePresets.soldOut()] }),

    featured: () => buildEventData({ isFeatured: true }),
    saved: () => buildEventData({ isSaved: true }),
    participating: () =>
        buildEventData({ amIParticipating: true, isSaved: true }),
    createdByMe: () => buildEventData({ isCreatedByMe: true }),

    withComments: () =>
        buildEventData({
            comments: Array.from({ length: 5 }, () => buildEventComment()),
        }),

    withGallery: () =>
        buildEventData({
            gallery: Array.from(
                { length: 6 },
                (_, i) => `/events/gallery-${i + 1}.jpg`,
            ),
        }),

    massive: () =>
        buildEventData({
            participants: 50000,
            interested: 200000,
        }),
};

export const buildEventList = (count = 10): EventData[] =>
    Array.from({ length: count }, () => buildEventData());

export const buildAllStatusEvents = (): EventData[] =>
    ALL_EVENT_STATUSES.map(status => buildEventData({ status }));

export const buildAllTypeEvents = (): EventData[] =>
    ALL_EVENT_TYPES.map(type => buildEventData({ type }));

export const eventStatusValues = ALL_EVENT_STATUSES;
export const eventTimelineValues = ALL_EVENT_TIMELINES;
export const eventTypeValues = ALL_EVENT_TYPES;
