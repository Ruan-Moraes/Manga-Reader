import type { LocalTranslationLibraryItem } from '@/entities/local-translation-result';
import type { LocalWork, LocalWorkChapter } from '@/entities/local-work';

export type LibraryChapterState = 'waiting' | 'processing' | 'saved' | 'failed' | 'incomplete';
export type WorkSortOrder = 'recent' | 'alpha';

export interface LibraryChapter {
    projectId: string;
    /** Chapter label from 055; null for chapters without a work (title is derived from `createdAt`). */
    label: string | null;
    /** Link to the work (055), null for chapters without a work. */
    link: LocalWorkChapter | null;
    createdAt: number;
    pages: number;
    readyPages: number;
    failedPages: number;
    state: LibraryChapterState;
    /** 1-based page of the saved reading position, or null without progress. */
    currentPage: number | null;
    progressUpdatedAt: number | null;
    coverUri: string;
    sourceLanguage: string;
    targetLanguage: string;
    demo: boolean;
}

export interface LibraryWork {
    work: LocalWork;
    chapters: LibraryChapter[];
    pages: number;
    failedChapters: number;
    processingChapters: number;
    languages: string[];
    /** Most recently read chapter of this work. */
    lastRead: LibraryChapter | null;
}

export interface ContinueReading {
    work: LocalWork | null;
    chapter: LibraryChapter;
}

export interface LibraryOverview {
    works: LibraryWork[];
    unassigned: LibraryChapter[];
    continueReading: ContinueReading | null;
}

function chapterState(item: LocalTranslationLibraryItem, failedPages: number, attempted: boolean): LibraryChapterState {
    const statuses = item.project.pages.map(page => page.status);
    if (failedPages > 0) return 'failed';
    if (statuses.some(status => status === 'QUEUED' || status === 'PROCESSING')) return 'processing';
    if (statuses.length > 0 && statuses.every(status => status === 'READY')) return 'saved';
    return item.readyPages > 0 || attempted ? 'incomplete' : 'waiting';
}

type ChapterAttempts = ReadonlyMap<string, { failedPages: number; attempted: boolean }>;

export function libraryChapter(item: LocalTranslationLibraryItem, link: LocalWorkChapter | null, evidence?: ChapterAttempts): LibraryChapter {
    const pages = item.project.pages.length;
    const position = item.currentPosition;
    const validPosition = position !== null && Number.isInteger(position) && position >= 0 && position < pages && item.progressUpdatedAt !== null;
    const failedPages = evidence ? (evidence.get(item.project.id)?.failedPages ?? 0) : item.project.pages.filter(page => page.status === 'FAILED').length;
    return {
        projectId: item.project.id,
        label: link?.label ?? null,
        link,
        createdAt: item.project.createdAt,
        pages,
        readyPages: item.readyPages,
        failedPages,
        state: chapterState(item, failedPages, evidence?.get(item.project.id)?.attempted ?? false),
        currentPage: validPosition ? position + 1 : null,
        progressUpdatedAt: validPosition ? item.progressUpdatedAt : null,
        coverUri: item.coverUri,
        sourceLanguage: item.project.sourceLanguage,
        targetLanguage: item.project.targetLanguage,
        demo: item.demo,
    };
}

function mostRecentlyRead(chapters: readonly LibraryChapter[]): LibraryChapter | null {
    let latest: LibraryChapter | null = null;
    for (const chapter of chapters) {
        if (chapter.currentPage === null || chapter.readyPages === 0 || chapter.progressUpdatedAt === null) continue;
        if (!latest || chapter.progressUpdatedAt > (latest.progressUpdatedAt ?? 0)) latest = chapter;
    }
    return latest;
}

export function buildLibraryOverview(
    works: readonly LocalWork[],
    chaptersByWork: readonly (readonly LocalWorkChapter[])[],
    items: readonly LocalTranslationLibraryItem[],
    unassignedProjectIds: readonly string[],
    evidence?: ChapterAttempts,
): LibraryOverview {
    const byProject = new Map(items.map(item => [item.project.id, item]));
    const libraryWorks = works.map((work, index): LibraryWork => {
        const chapters = (chaptersByWork[index] ?? []).flatMap(link => {
            const item = byProject.get(link.projectId);
            return item ? [libraryChapter(item, link, evidence)] : [];
        });
        const languages = [...new Set(chapters.map(chapter => `${chapter.sourceLanguage}→${chapter.targetLanguage}`))];
        return {
            work,
            chapters,
            pages: chapters.reduce((sum, chapter) => sum + chapter.pages, 0),
            failedChapters: chapters.filter(chapter => chapter.state === 'failed').length,
            processingChapters: chapters.filter(chapter => chapter.state === 'processing').length,
            languages,
            lastRead: mostRecentlyRead(chapters),
        };
    });
    const unassignedIds = new Set(unassignedProjectIds);
    const unassigned = items.filter(item => unassignedIds.has(item.project.id)).map(item => libraryChapter(item, null, evidence));

    const candidates: ContinueReading[] = [
        ...libraryWorks.flatMap(entry => (entry.lastRead ? [{ work: entry.work, chapter: entry.lastRead }] : [])),
        ...unassigned.flatMap(chapter => (mostRecentlyRead([chapter]) ? [{ work: null, chapter }] : [])),
    ];
    const continueReading = candidates.reduce<ContinueReading | null>(
        (latest, candidate) => (!latest || (candidate.chapter.progressUpdatedAt ?? 0) > (latest.chapter.progressUpdatedAt ?? 0) ? candidate : latest),
        null,
    );
    return { works: libraryWorks, unassigned, continueReading };
}

function recency(entry: LibraryWork): number {
    return Math.max(entry.work.updatedAt, entry.lastRead?.progressUpdatedAt ?? 0);
}

export function sortWorks(works: readonly LibraryWork[], order: WorkSortOrder, locale: string): LibraryWork[] {
    const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
    return [...works].sort((left, right) =>
        order === 'alpha' ? collator.compare(left.work.name, right.work.name) || left.work.id.localeCompare(right.work.id) : recency(right) - recency(left),
    );
}

/** 1-based position of the chapter inside its work, as shown in "Capítulo N". */
export function chapterNumber(entry: LibraryWork, projectId: string): number | null {
    const index = entry.chapters.findIndex(chapter => chapter.projectId === projectId);
    return index < 0 ? null : index + 1;
}
