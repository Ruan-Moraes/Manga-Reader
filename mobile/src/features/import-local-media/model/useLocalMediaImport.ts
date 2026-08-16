import { useCallback, useEffect, useState } from 'react';

import type { LocalMediaImportDraft } from '@/src/entities/local-media-import';

import {
    type LocalMediaImportController,
    localMediaImportController,
    LocalMediaImportError,
    type LocalMediaImportErrorCode,
    type LocalMediaImportOutcome,
} from './importLocalMedia';

export interface LocalMediaImportViewState {
    status: 'loading' | 'idle' | 'importing' | 'ready' | 'error';
    draft: LocalMediaImportDraft | null;
    error: LocalMediaImportErrorCode | null;
}

const INITIAL_STATE: LocalMediaImportViewState = { status: 'loading', draft: null, error: null };

const errorCode = (error: unknown): LocalMediaImportErrorCode => (error instanceof LocalMediaImportError ? error.code : 'storage-unavailable');

export function useLocalMediaImport(
    controller: LocalMediaImportController = localMediaImportController,
    onDraftChange?: (draft: LocalMediaImportDraft | null) => void,
) {
    const [state, setState] = useState<LocalMediaImportViewState>(INITIAL_STATE);

    const applyOutcome = useCallback(
        (outcome: LocalMediaImportOutcome) => {
            if (outcome.status === 'imported') {
                setState({ status: 'ready', draft: outcome.draft, error: null });
                onDraftChange?.(outcome.draft);
                return;
            }
            setState(current => {
                return { status: current.draft ? 'ready' : 'idle', draft: current.draft, error: null };
            });
        },
        [onDraftChange],
    );

    const hydrate = useCallback(async () => {
        setState(current => ({ ...current, status: 'loading', error: null }));
        try {
            const draft = await controller.initialize();
            setState({ status: draft ? 'ready' : 'idle', draft, error: null });
            onDraftChange?.(draft);
            applyOutcome(await controller.recoverPendingSelection());
        } catch (error) {
            setState(current => ({ status: 'error', draft: current.draft, error: errorCode(error) }));
        }
    }, [applyOutcome, controller, onDraftChange]);

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    const selectImages = useCallback(async () => {
        setState(current => ({ ...current, status: 'importing', error: null }));
        try {
            applyOutcome(await controller.selectImages());
        } catch (error) {
            setState(current => ({ status: 'error', draft: current.draft, error: errorCode(error) }));
        }
    }, [applyOutcome, controller]);

    return { state, selectImages, retry: selectImages };
}
