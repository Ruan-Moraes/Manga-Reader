export type EventStatus =
    | 'happening_now'
    | 'registrations_open'
    | 'coming_soon'
    | 'ended';

export type EventTimeline = 'upcoming' | 'ongoing' | 'past';

export type EventType =
    | 'Convenção'
    | 'Lançamento'
    | 'Live'
    | 'Workshop'
    | 'Meetup';

export type TicketType = {
    id: string;
    name: string;
    price: string;
    available: number;
};

export type EventComment = {
    id: string;
    user: string;
    message: string;
    createdAt: string;
};

export type EventData = {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    gallery: string[];
    startDate: string;
    endDate: string;
    timezone: string;
    timeline: EventTimeline;
    status: EventStatus;
    type: EventType;
    location: {
        label: string;
        address: string;
        city: string;
        isOnline: boolean;
        mapLink: string;
        directions: string;
    };
    organizer: {
        id: string;
        name: string;
        avatar: string;
        profileLink: string;
        contact: string;
    };
    priceLabel: string;
    participants: number;
    interested: number;
    isFeatured?: boolean;
    isCreatedByMe?: boolean;
    amIParticipating?: boolean;
    isSaved?: boolean;
    schedule: string[];
    specialGuests: string[];
    tickets: TicketType[];
    socialLinks: {
        instagram?: string;
        twitter?: string;
        website?: string;
    };
    comments: EventComment[];
    relatedEventIds: string[];
};
