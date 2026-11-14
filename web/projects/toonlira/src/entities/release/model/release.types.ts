import type { PageResponse } from '@shared/service/http';

export type ReleasePeriod = 'DAY' | 'WEEK' | 'MONTH';

export type ReleaseScanGroup = {
    id: string;
    name: string;
    logo?: string;
};

export type Release = {
    chapterId: string;
    titleId: string;
    titleName: string;
    titleCover?: string;
    chapterNumber: string;
    chapterTitle?: string;
    publishedAt: string;
    contentLanguage?: string;
    scanGroup?: ReleaseScanGroup;
    seen: boolean;
};

export type ReleaseFeed = {
    releases: PageResponse<Release>;
    availableLanguages: string[];
};

export type ReleaseQuery = {
    q?: string;
    language?: string;
    period: ReleasePeriod;
    libraryOnly: boolean;
    timeZone: string;
    page: number;
    size?: number;
};
