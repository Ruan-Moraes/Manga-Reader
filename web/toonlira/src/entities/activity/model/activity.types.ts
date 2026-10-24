export type ChapterReadPayload = {
    titleId: string;
    titleName: string;
    titleCover?: string;
    chapterNumber: string;
};

export type ReviewPostedPayload = {
    titleId: string;
    titleName: string;
    titleCover?: string;
    reviewId: string;
    rating: number;
};

export type TitleCompletedPayload = {
    titleId: string;
    titleName: string;
    titleCover?: string;
};

export type UserFollowedPayload = {
    targetType: 'USER' | 'GROUP';
    targetId: string;
    targetName: string;
    targetAvatar?: string;
};

export type ActivityEvent =
    | { id: string; type: 'CHAPTER_READ'; payload: ChapterReadPayload; occurredAt: string }
    | { id: string; type: 'REVIEW_POSTED'; payload: ReviewPostedPayload; occurredAt: string }
    | { id: string; type: 'TITLE_COMPLETED'; payload: TitleCompletedPayload; occurredAt: string }
    | { id: string; type: 'USER_FOLLOWED'; payload: UserFollowedPayload; occurredAt: string };

export type ActivityEventType = ActivityEvent['type'];
