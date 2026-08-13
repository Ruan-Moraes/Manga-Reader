import { type PropsWithChildren, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { deriveGuestContentLanguages } from '@/src/entities/content-language-preference';
import { useSessionStore } from '@/src/entities/session';
import {
    contentLanguageQueryKeys,
    hydrateContentLanguages,
    resetContentLanguagesHydration,
    resetContentLanguagesMutationRuntime,
    useContentLanguagesStore,
} from '@/src/features/manage-content-languages';
import { useSettingsStore } from '@/src/features/manage-settings';
import { StartupFeedback } from '@/src/shared/ui';

interface IdentityBoundaryProps extends PropsWithChildren {
    identityEpoch: number;
    isAuthenticated: boolean;
}

export function ContentLanguagesIdentityBoundary({ children, identityEpoch, isAuthenticated }: IdentityBoundaryProps) {
    const contentIdentityEpoch = useContentLanguagesStore(state => state.identityEpoch);
    const { t } = useTranslation('settingsNavigation');
    const identityAligned = isAuthenticated ? contentIdentityEpoch === identityEpoch : contentIdentityEpoch === null;
    return identityAligned ? children : <StartupFeedback label={t('sync.syncing')} />;
}

export function ContentLanguagesAccountGate({ children }: PropsWithChildren) {
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const language = useSettingsStore(state => state.language);
    const queryClient = useQueryClient();

    useEffect(() => {
        const currentLanguage = useSettingsStore.getState().language;
        const fallback = deriveGuestContentLanguages(currentLanguage);
        resetContentLanguagesMutationRuntime();
        resetContentLanguagesHydration();
        contentLanguageQueryKeys().forEach(queryKey => queryClient.removeQueries({ queryKey, exact: false }));

        if (isAuthenticated) {
            useContentLanguagesStore.getState().beginAccount(identityEpoch, currentLanguage, fallback);
            void hydrateContentLanguages(identityEpoch);
        } else {
            useContentLanguagesStore.getState().beginGuest(currentLanguage, fallback);
        }
    }, [identityEpoch, isAuthenticated, queryClient]);

    useEffect(() => {
        useContentLanguagesStore.getState().updateInterfaceLanguage(language, deriveGuestContentLanguages(language));
    }, [language]);

    return (
        <ContentLanguagesIdentityBoundary identityEpoch={identityEpoch} isAuthenticated={isAuthenticated}>
            {children}
        </ContentLanguagesIdentityBoundary>
    );
}
