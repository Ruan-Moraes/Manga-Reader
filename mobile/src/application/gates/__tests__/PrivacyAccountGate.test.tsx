import { Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';
import AxiosMockAdapter from 'axios-mock-adapter';

import { useSessionStore } from '@/entities/session';
import { usePrivacySettingsStore } from '@/entities/user';
import { api } from '@/shared/api';

import { PrivacyAccountGate } from '../PrivacyAccountGate';

describe('MOB-FEAT-006 PrivacyAccountGate', () => {
    const apiMock = new AxiosMockAdapter(api);
    const privacy = {
        commentVisibility: 'PRIVATE',
        viewHistoryVisibility: 'PRIVATE',
        libraryVisibility: 'PRIVATE',
        adultContentPreference: 'HIDE',
        behaviorAnalyticsEnabled: false,
    };

    afterEach(() => apiMock.reset());
    afterAll(() => apiMock.restore());

    it('hidrata pela Core e remove estado privado e caches ao trocar de identidade e no logout', async () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(['user', 'old-account'], { secret: true });
        useSessionStore.setState({ isAuthenticated: true, identityEpoch: 1 });
        apiMock.onGet('/users/me/profile').reply(200, { data: { privacySettings: privacy } });

        const view = render(
            <QueryClientProvider client={queryClient}>
                <PrivacyAccountGate>
                    <Text>content</Text>
                </PrivacyAccountGate>
            </QueryClientProvider>,
        );
        await waitFor(() => expect(usePrivacySettingsStore.getState().current).toEqual(privacy));

        act(() => useSessionStore.setState({ isAuthenticated: true, identityEpoch: 2 }));
        await waitFor(() => expect(usePrivacySettingsStore.getState()).toMatchObject({ identityEpoch: 2 }));
        expect(queryClient.getQueryData(['user', 'old-account'])).toBeUndefined();

        act(() => useSessionStore.setState({ isAuthenticated: false, identityEpoch: 3 }));
        expect(usePrivacySettingsStore.getState().identityEpoch).toBeNull();
        view.unmount();
    });
});
