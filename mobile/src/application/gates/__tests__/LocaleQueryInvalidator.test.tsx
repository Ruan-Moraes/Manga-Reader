import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';

import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import { resetSettingsRuntimeForTests, useSettingsStore } from '@/src/features/manage-settings';
import { DEFAULT_LANGUAGE } from '@/src/shared/i18n';

import { LocaleQueryInvalidator } from '../LocaleQueryInvalidator';

describe('MOB-FEAT-003 invalidação seletiva por locale', () => {
    beforeEach(() => {
        resetSettingsRuntimeForTests();
        useSettingsStore.setState({
            settings: DEFAULT_USER_SETTINGS,
            guestSettings: DEFAULT_USER_SETTINGS,
            themeOverride: null,
            language: DEFAULT_LANGUAGE,
            isHydrated: true,
            activeIdentityEpoch: null,
            syncStatus: 'local',
            pendingVersion: null,
            localError: null,
            syncError: null,
        });
    });

    it('invalida somente queries marcadas e preserva dados locais e independentes', async () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(['localized-title'], { title: 'Título' });
        queryClient
            .getQueryCache()
            .find({ queryKey: ['localized-title'] })
            ?.setOptions({ meta: { localeDependent: true } });
        queryClient.setQueryData(['local-form'], { draft: 'não perder' });

        const { unmount } = render(
            <QueryClientProvider client={queryClient}>
                <LocaleQueryInvalidator />
            </QueryClientProvider>,
        );

        act(() => useSettingsStore.setState({ language: 'en-US' }));

        await waitFor(() => expect(queryClient.getQueryState(['localized-title'])?.isInvalidated).toBe(true));
        expect(queryClient.getQueryData(['localized-title'])).toEqual({ title: 'Título' });
        expect(queryClient.getQueryState(['local-form'])?.isInvalidated).toBe(false);
        expect(queryClient.getQueryData(['local-form'])).toEqual({ draft: 'não perder' });
        unmount();
        queryClient.clear();
    });
});
