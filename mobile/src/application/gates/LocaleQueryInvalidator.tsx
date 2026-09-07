import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSettingsStore } from '@/features/manage-settings';

export function LocaleQueryInvalidator() {
    const queryClient = useQueryClient();
    const language = useSettingsStore(state => state.language);
    const previousLanguage = useRef(language);

    useEffect(() => {
        if (previousLanguage.current === language) return;
        previousLanguage.current = language;
        void queryClient.invalidateQueries({ predicate: query => query.meta?.localeDependent === true });
    }, [language, queryClient]);

    return null;
}
