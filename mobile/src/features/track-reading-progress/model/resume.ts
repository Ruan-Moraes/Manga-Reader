import type { ReadingProgress } from '@/src/entities/reading-progress';

export interface ResumeChoice {
    kind: 'requested' | 'choose';
    chapterNumber: string;
    currentPage: number;
    recent?: ReadingProgress;
}

export function resolveResumeChoice(requestedChapter: string, progress: ReadingProgress | null, titleId: string): ResumeChoice {
    if (!progress || progress.titleId !== titleId) return { kind: 'requested', chapterNumber: requestedChapter, currentPage: 1 };
    if (progress.chapterNumber === requestedChapter) {
        return { kind: 'requested', chapterNumber: requestedChapter, currentPage: progress.currentPage };
    }
    return { kind: 'choose', chapterNumber: requestedChapter, currentPage: 1, recent: progress };
}

export function isReadingProgressValidForChapter(progress: ReadingProgress, chapterNumber: string, actualTotalPages: number): boolean {
    return (
        progress.chapterNumber === chapterNumber &&
        actualTotalPages > 0 &&
        progress.totalPages === actualTotalPages &&
        progress.currentPage >= 1 &&
        progress.currentPage <= actualTotalPages
    );
}
