import { useCallback, useEffect, useRef, useState } from 'react';

import type { LocalMediaImportDraft } from '@/entities/local-media-import';

import {
    type ReviewLocalMediaImportController,
    reviewLocalMediaImportController,
    ReviewLocalMediaImportError,
    type ReviewLocalMediaImportErrorCode,
    type ReviewLocalMediaImportOutcome,
} from './reviewLocalMediaImport';

type ReviewAction = () => Promise<ReviewLocalMediaImportOutcome>;

const errorCode = (error: unknown): ReviewLocalMediaImportErrorCode => (error instanceof ReviewLocalMediaImportError ? error.code : 'storage-unavailable');

export function useReviewLocalMediaImport(
    draft: LocalMediaImportDraft,
    onDraftChange: (draft: LocalMediaImportDraft | null) => void,
    controller: ReviewLocalMediaImportController = reviewLocalMediaImportController,
) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<ReviewLocalMediaImportErrorCode | null>(null);
    const retryRef = useRef<ReviewAction | null>(null);

    useEffect(() => {
        void controller.reconcile(draft).catch(() => setError('storage-unavailable'));
    }, [controller, draft]);

    const execute = useCallback(
        async (action: ReviewAction) => {
            if (busy) return;
            retryRef.current = action;
            setBusy(true);
            setError(null);
            try {
                const outcome = await action();
                onDraftChange(outcome.status === 'cleared' ? null : outcome.draft);
                return true;
            } catch (caught) {
                setError(errorCode(caught));
                onDraftChange(await controller.reload().catch(() => draft));
                return false;
            } finally {
                setBusy(false);
            }
        },
        [busy, controller, draft, onDraftChange],
    );

    return {
        busy,
        error,
        addImages: () => execute(() => controller.addImages(draft)),
        removeItem: (itemId: string) => execute(() => controller.removeItem(draft, itemId)),
        moveItem: (itemId: string, offset: -1 | 1) => execute(() => controller.moveItem(draft, itemId, offset)),
        reorderItems: (orderedItemIds: readonly string[]) => execute(() => controller.reorderItems(draft, orderedItemIds)),
        confirm: () => execute(() => controller.confirm(draft)),
        retry: () => (retryRef.current ? execute(retryRef.current) : Promise.resolve()),
    };
}
