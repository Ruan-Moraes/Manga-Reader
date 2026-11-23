export type DomainLabelOption = {
    value: string;
    label: string;
};

export type DomainLabelAdminOption = {
    value: string;
    labelI18n: Record<string, string>;
};

export const LABEL_TYPES = {
    PUBLICATION_STATUS: 'publication_status',
    NEWS_CATEGORY: 'news_category',
    EVENT_TYPE: 'event_type',
    EVENT_STATUS: 'event_status',
    EVENT_TIMELINE: 'event_timeline',
    CURRENCY: 'currency',
} as const;
