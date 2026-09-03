import { useCallback, useRef, useState } from 'react';

import type { LocalMediaImportDraft } from '@/src/entities/local-media-import';

import {
    type ValidateLocalMediaController,
    validateLocalMediaController,
    ValidateLocalMediaError,
    type ValidateLocalMediaErrorCode,
    type ValidationProgress,
} from './validateLocalMedia';

export function useValidateLocalMedia(
    draft: LocalMediaImportDraft,
    onDraftChange: (draft: LocalMediaImportDraft) => void,
    controller: ValidateLocalMediaController = validateLocalMediaController,
) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<ValidateLocalMediaErrorCode | null>(null);
    const [progress, setProgress] = useState<ValidationProgress | null>(null);
    const [replacingItemId, setReplacingItemId] = useState<string | null>(null);
    const [failedReplacementItemId, setFailedReplacementItemId] = useState<string | null>(null);

    const forceRef = useRef(false);

    const execute = useCallback(
        async (force = false) => {
            if (busy) return;

            forceRef.current = force;
            setFailedReplacementItemId(null);

            setBusy(true);
            setError(null);

            try {
                const updated = await controller.validate(draft, { force, onProgress: setProgress });

                onDraftChange(updated);
            } catch (caught) {
                setError(caught instanceof ValidateLocalMediaError ? caught.code : 'storage-unavailable');

                const persisted = await controller.reload().catch(() => null);

                if (persisted) onDraftChange(persisted);
            } finally {
                setBusy(false);
            }
        },
        [busy, controller, draft, onDraftChange],
    );

    const replaceItem = useCallback(
        async (itemId: string) => {
            if (busy || replacingItemId) return;
            setReplacingItemId(itemId);
            setError(null);
            try {
                const updated = await controller.replaceItem(draft, itemId);
                onDraftChange(updated);
                setFailedReplacementItemId(null);
                return updated !== draft;
            } catch (caught) {
                setFailedReplacementItemId(itemId);
                setError(caught instanceof ValidateLocalMediaError ? caught.code : 'storage-unavailable');
                const persisted = await controller.reload().catch(() => null);
                if (persisted) onDraftChange(persisted);
                return false;
            } finally {
                setReplacingItemId(null);
            }
        },
        [busy, controller, draft, onDraftChange, replacingItemId],
    );

    return {
        busy,
        error,
        progress,
        replacingItemId,
        replaceItem,
        validate: () => execute(false),
        retry: () => (failedReplacementItemId ? replaceItem(failedReplacementItemId) : execute(forceRef.current)),
    };
}
