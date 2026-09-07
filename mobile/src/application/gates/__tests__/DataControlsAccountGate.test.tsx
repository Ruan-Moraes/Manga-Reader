import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/entities/session';
import { clearDataControlTemporaries } from '@/features/data-controls';

import { DataControlsAccountGate } from '../DataControlsAccountGate';

jest.mock('@/features/data-controls', () => ({ clearDataControlTemporaries: jest.fn().mockResolvedValue(undefined) }));

describe('MOB-FEAT-007 DataControlsAccountGate', () => {
    it('remove temporários ao iniciar e trocar a identidade', async () => {
        useSessionStore.setState({ identityEpoch: 0 });
        render(
            <DataControlsAccountGate>
                <Text>conteúdo</Text>
            </DataControlsAccountGate>,
        );

        expect(screen.getByText('conteúdo')).toBeOnTheScreen();
        await waitFor(() => expect(clearDataControlTemporaries).toHaveBeenCalledTimes(1));

        act(() => useSessionStore.setState({ identityEpoch: 1 }));
        await waitFor(() => expect(clearDataControlTemporaries).toHaveBeenCalledTimes(2));
    });
});
