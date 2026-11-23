import type { ReadingProgress } from '@/entities/reading-progress';

import { putReadingProgress } from '../api/trackReadingProgressApi';

export interface ProgressSyncState {
    status: 'idle' | 'pending' | 'syncing' | 'error';
    error: string | null;
    version: number;
}

export function createProgressSnapshot(
    titleId: string,
    chapterNumber: string,
    currentPage: number,
    totalPages: number,
    autoMarkRead: boolean,
): ReadingProgress | null {
    if (!Number.isInteger(totalPages) || totalPages < 1) return null;
    const page = Math.min(totalPages, Math.max(1, Math.trunc(currentPage)));
    return { titleId, chapterNumber, currentPage: page, totalPages, completed: autoMarkRead && page === totalPages };
}

export class ProgressSynchronizer {
    private controller: AbortController | null = null;
    private identityEpoch: number | null = null;
    private pending: { version: number; value: ReadingProgress } | null = null;
    private version = 0;
    private state: ProgressSyncState = { status: 'idle', error: null, version: 0 };

    getState(): ProgressSyncState {
        return this.state;
    }

    activate(identityEpoch: number | null): void {
        if (this.identityEpoch === identityEpoch) return;
        this.controller?.abort();
        this.controller = null;
        this.identityEpoch = identityEpoch;
        this.pending = null;
        this.state = { status: 'idle', error: null, version: this.version };
    }

    async deactivate(): Promise<void> {
        const identityEpoch = this.identityEpoch;
        if (identityEpoch === null) return;
        await this.flush();
        if (this.identityEpoch === identityEpoch) this.activate(null);
    }

    queue(value: ReadingProgress): void {
        if (this.identityEpoch === null) return;
        const version = ++this.version;
        this.pending = { version, value };
        this.state = { status: 'pending', error: null, version };
    }

    async flush(): Promise<void> {
        const pending = this.pending;
        const identityEpoch = this.identityEpoch;
        if (!pending || identityEpoch === null) return;
        this.controller?.abort();
        const controller = new AbortController();
        this.controller = controller;
        this.state = { status: 'syncing', error: null, version: pending.version };
        try {
            await putReadingProgress(pending.value, controller.signal);
            if (this.identityEpoch !== identityEpoch || this.pending?.version !== pending.version) return;
            this.pending = null;
            this.state = { status: 'idle', error: null, version: pending.version };
        } catch (error) {
            if (controller.signal.aborted || this.identityEpoch !== identityEpoch || this.pending?.version !== pending.version) return;
            this.state = { status: 'error', error: error instanceof Error ? error.message : 'progress_sync_error', version: pending.version };
        } finally {
            if (this.controller === controller) this.controller = null;
        }
    }

    retry(): Promise<void> {
        return this.flush();
    }
}
