import type { StatusTone } from '@ui/StatusPill';

/**
 * Mapeia os enums de status do backend para os 4 tons disciplinados do DS
 * (live=accent, open=accent-75, soon=tertiary, ended=danger).
 * Ver docs/handoff: TITLE/EVENT/PAYMENT/SUB/GROUP_STATUS_TONE.
 */
export const TITLE_STATUS_TONE: Record<string, StatusTone> = {
    ONGOING: 'live',
    COMPLETED: 'open',
    HIATUS: 'soon',
    CANCELLED: 'ended',
};

export const EVENT_STATUS_TONE: Record<string, StatusTone> = {
    HAPPENING_NOW: 'live',
    REGISTRATIONS_OPEN: 'open',
    COMING_SOON: 'soon',
    ENDED: 'ended',
};

export const PAYMENT_STATUS_TONE: Record<string, StatusTone> = {
    COMPLETED: 'live',
    REFUNDED: 'open',
    PENDING: 'soon',
    FAILED: 'ended',
};

export const SUBSCRIPTION_STATUS_TONE: Record<string, StatusTone> = {
    ACTIVE: 'live',
    EXPIRED: 'soon',
    CANCELLED: 'ended',
};

export const GROUP_STATUS_TONE: Record<string, StatusTone> = {
    ACTIVE: 'live',
    HIATUS: 'open',
    INACTIVE: 'soon',
};

export const toneFor = (map: Record<string, StatusTone>, status: string | null | undefined): StatusTone => (status && map[status]) || 'soon';

export type StatusDomain = 'title' | 'event' | 'payment' | 'subscription' | 'group';

/** Chave i18n compartilhada do rótulo de status (mesma fonte para listas e overview). */
export const statusLabelKey = (domain: StatusDomain, status: string | null | undefined): string => `dashboard.status.${domain}.${status ?? 'UNKNOWN'}`;
