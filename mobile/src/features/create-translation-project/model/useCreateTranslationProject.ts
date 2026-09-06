import { useCallback, useEffect, useState } from 'react';

import type { LocalMediaImportDraft } from '@/entities/local-media-import';
import type { TranslationProject } from '@/entities/translation-project';

import {
    type CreateTranslationProjectController,
    CreateTranslationProjectError,
    type CreateTranslationProjectErrorCode,
    translationProjectController,
} from './createTranslationProject';

export function useCreateTranslationProject(controller: CreateTranslationProjectController = translationProjectController) {
    const [project, setProject] = useState<TranslationProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<CreateTranslationProjectErrorCode | null>(null);

    useEffect(() => {
        let active = true;
        void controller
            .initialize()
            .then(result => {
                if (active) setProject(result);
            })
            .catch(() => {
                if (active) setError('storage-unavailable');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [controller]);

    const prepare = useCallback(
        async (draft: LocalMediaImportDraft) => {
            if (busy) return null;
            setBusy(true);
            setError(null);
            try {
                const result = await controller.prepare(draft);
                setProject(result);
                return result;
            } catch (cause) {
                setError(cause instanceof CreateTranslationProjectError ? cause.code : 'storage-unavailable');
                return null;
            } finally {
                setBusy(false);
            }
        },
        [busy, controller],
    );

    return { project, loading, busy, error, prepare };
}
