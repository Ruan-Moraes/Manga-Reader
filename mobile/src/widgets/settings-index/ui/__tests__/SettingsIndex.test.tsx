import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/src/shared/theme';

import { SettingsIndex } from '../SettingsIndex';

describe('MOB-FEAT-008/AC-001/004/008 SettingsIndex', () => {
    it('anuncia status, mantém alvo acionável para login e preserva a ordem do manifesto', () => {
        const local = jest.fn();
        const privateAction = jest.fn();
        render(
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <SettingsIndex
                    items={[
                        { id: 'appearance', title: 'Aparência', description: 'Tema', statusLabel: 'Salvo localmente', loginRequired: false, onPress: local },
                        {
                            id: 'privacy',
                            title: 'Privacidade',
                            description: 'Visibilidade',
                            statusLabel: 'Salvo localmente',
                            loginRequired: true,
                            onPress: privateAction,
                        },
                    ]}
                    loginRequiredLabel="Login necessário"
                    openHint="Abrir"
                />
            </ThemeProvider>,
        );

        expect(screen.getAllByRole('button').map(node => node.props.accessibilityLabel)).toEqual([
            'Aparência. Salvo localmente',
            'Privacidade. Salvo localmente',
        ]);
        fireEvent.press(screen.getByLabelText('Privacidade. Salvo localmente'));
        expect(privateAction).toHaveBeenCalledTimes(1);
    });
});
