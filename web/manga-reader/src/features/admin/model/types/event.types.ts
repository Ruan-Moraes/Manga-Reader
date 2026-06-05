import type { LocalizedString } from '@shared/type/i18n';

export type AdminEvent = {
    id: string;
    title: LocalizedString;
    subtitle: LocalizedString;
    description: LocalizedString;
    image: string | null;
    startDate: string;
    endDate: string;
    timezone: string | null;
    timeline: string;
    status: string;
    type: string;
    locationLabel: string | null;
    locationCity: string | null;
    locationIsOnline: boolean;
    organizerName: string | null;
    priceLabel: string | null;
    participants: number;
    interested: number;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string | null;
};

export type CreateEventRequest = {
    title: LocalizedString;
    startDate: string;
    endDate: string;
    timeline: string;
    status: string;
    type: string;
    subtitle?: LocalizedString;
    description?: LocalizedString;
    image?: string;
    timezone?: string;
    locationLabel?: string;
    locationAddress?: string;
    locationCity?: string;
    locationIsOnline: boolean;
    locationMapLink?: string;
    organizerName?: string;
    organizerContact?: string;
    priceLabel?: string;
    isFeatured: boolean;
    schedule?: string[];
    specialGuests?: string[];
};

export type UpdateEventRequest = Partial<CreateEventRequest>;
