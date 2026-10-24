import type { ActivityEventType } from '../../model/activity.types';
import type { ActivityRowRenderer } from './types';
import ChapterReadRow from './ChapterReadRow';
import ReviewPostedRow from './ReviewPostedRow';
import TitleCompletedRow from './TitleCompletedRow';
import UserFollowedRow from './UserFollowedRow';

/**
 * Registro tipo→componente. Adicionar um tipo de evento novo é adicionar uma
 * entrada aqui (+ o componente correspondente) — sem tocar em `ActivityEventRow`
 * nem inflar um switch/if.
 */
export const ACTIVITY_ROW_RENDERERS: Record<ActivityEventType, ActivityRowRenderer> = {
    CHAPTER_READ: ChapterReadRow,
    REVIEW_POSTED: ReviewPostedRow,
    TITLE_COMPLETED: TitleCompletedRow,
    USER_FOLLOWED: UserFollowedRow,
};
