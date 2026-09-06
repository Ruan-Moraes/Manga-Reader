import { StyleSheet, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { SettingsIndex } from '../SettingsIndex';
import { SettingsSections } from '../SettingsSections';

describe('MOB-FEAT-008/AC-001/004/008 SettingsIndex', () => {
    it('mantém separação editorial ampla entre os grupos do índice', () => {
        render(
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <SettingsSections>
                    <View />
                    <View />
                </SettingsSections>
            </ThemeProvider>,
        );

        expect(StyleSheet.flatten(screen.getByTestId('settings-sections').props.style)).toEqual(expect.objectContaining({ gap: 32 }));
    });

    it('anuncia status, mantém alvo acionável para login e preserva a ordem do manifesto', () => {
        const local = jest.fn();
        const privateAction = jest.fn();
        render(
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <SettingsIndex
                    items={[
                        {
                            id: 'appearance',
                            title: 'Aparência',
                            description: 'Tema',
                            loginRequired: false,
                            icon: 'contrast-outline',
                            statusTone: 'neutral',
                            onPress: local,
                        },
                        {
                            id: 'privacy',
                            title: 'Privacidade',
                            description: 'Visibilidade',
                            loginRequired: true,
                            icon: 'shield-checkmark-outline',
                            statusTone: 'neutral',
                            onPress: privateAction,
                        },
                    ]}
                    loginRequiredLabel="Login necessário"
                    openHint="Abrir"
                />
            </ThemeProvider>,
        );

        expect(screen.getAllByRole('button').map(node => node.props.accessibilityLabel)).toEqual(['Aparência', 'Privacidade']);
        expect(screen.queryByText('Salvo localmente')).toBeNull();
        expect(screen.getByText('Login necessário')).toBeOnTheScreen();
        fireEvent.press(screen.getByLabelText('Privacidade'));
        expect(privateAction).toHaveBeenCalledTimes(1);
    });
});
