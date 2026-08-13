export interface ReadingProgress {
    titleId: string;
    chapterNumber: string;
    currentPage: number;
    totalPages: number;
    completed: boolean;
}

export interface ReadingProgressDiagnostic {
    code: 'INVALID_READING_PROGRESS';
    titleId: string;
}

const diagnosticListeners = new Set<(diagnostic: ReadingProgressDiagnostic) => void>();

export function subscribeReadingProgressDiagnostics(listener: (diagnostic: ReadingProgressDiagnostic) => void): () => void {
    diagnosticListeners.add(listener);
    return () => diagnosticListeners.delete(listener);
}

export function reportInvalidReadingProgress(titleId: string): void {
    diagnosticListeners.forEach(listener => listener({ code: 'INVALID_READING_PROGRESS', titleId }));
}

const record = (value: unknown): Record<string, unknown> => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {});

export function normalizeReadingProgress(value: unknown): ReadingProgress | null {
    const source = record(value);
    const titleId = typeof source.titleId === 'string' ? source.titleId : '';
    const chapterNumber = typeof source.chapterNumber === 'string' ? source.chapterNumber.trim() : '';
    const currentPage = source.currentPage;
    const totalPages = source.totalPages;

    if (
        !titleId ||
        !chapterNumber ||
        typeof currentPage !== 'number' ||
        !Number.isInteger(currentPage) ||
        typeof totalPages !== 'number' ||
        !Number.isInteger(totalPages) ||
        totalPages < 1 ||
        currentPage < 1 ||
        currentPage > totalPages ||
        typeof source.completed !== 'boolean'
    ) {
        return null;
    }

    return { titleId, chapterNumber, currentPage, totalPages, completed: source.completed };
}
