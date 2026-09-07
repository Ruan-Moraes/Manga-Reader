import { useCallback, useMemo } from 'react';

import { useContentLocales } from '@entities/user';

import { useSettingsToast } from './useSettingsToast';

/**
 * Idiomas de leitura — persistidos em `contentLocales` (server quando logado). Garante ao menos
 * um idioma (`pt-BR`) e dispara toast de confirmação.
 */
export const useReadingLangs = (isLoggedIn: boolean) => {
    const { query, mutation } = useContentLocales(isLoggedIn);
    const fireToast = useSettingsToast();

    const readingLangs = useMemo<string[]>(() => query.data?.contentLocales ?? ['pt-BR'], [query.data]);

    const setReadingLangs = useCallback(
        (next: string[], toastTitle: string) => {
            const safe = next.length > 0 ? next : ['pt-BR'];

            fireToast(toastTitle);

            if (isLoggedIn) {
                mutation.mutate({ contentLocales: safe });
            }
        },
        [isLoggedIn, mutation, fireToast],
    );

    return { readingLangs, setReadingLangs };
};

export default useReadingLangs;
