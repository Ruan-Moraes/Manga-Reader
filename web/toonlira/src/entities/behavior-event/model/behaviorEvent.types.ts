export type BehaviorEventType =
    | 'TITLE_VIEW_QUALIFIED'
    | 'TITLE_VIEW_BOUNCE'
    | 'CHAPTER_SESSION_STARTED'
    | 'CHAPTER_PROGRESS_CHECKPOINT'
    | 'CHAPTER_SESSION_COMPLETED'
    | 'CHAPTER_SESSION_PARTIAL'
    | 'CHAPTER_NEXT_OPENED'
    | 'CHAPTER_RETURNED'
    | 'CHAPTER_REREAD'
    | 'SEARCH_PERFORMED'
    | 'SEARCH_NO_RESULTS'
    | 'SEARCH_RESULT_CLICKED'
    | 'CATALOG_FILTER_APPLIED'
    | 'STORE_OUTBOUND_CLICK';

export type BehaviorEvent = {
    eventId: string;
    type: BehaviorEventType;
    sessionId: string;
    occurredAt: string;
    platform: 'WEB';
    appVersion?: string;
    source?: string;
    titleId?: string;
    chapterNumber?: string;
    dwellMillis?: number;
    progressPercent?: number;
    searchTerm?: string;
    resultCount?: number;
    dedupeKey?: string;
};

export type BehaviorEventInput = Omit<BehaviorEvent, 'eventId' | 'sessionId' | 'occurredAt' | 'platform'>;
