import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { act, render } from '@testing-library/react-native';

import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { AuthHeader } from '../AuthHeader';

describe('MOB-BASE-004 auth header artwork', () => {
    afterEach(async () => {
        await act(async () => {
            await i18n.changeLanguage('pt-BR');
        });
    });

    it.each([
        ['pt-BR', 'Garota abrindo uma porta mágica para uma biblioteca'],
        ['en-US', 'Girl opening a magical door to a library'],
        ['es-ES', 'Chica abriendo una puerta mágica a una biblioteca'],
    ])('localiza a descrição da arte em %s', async (language, label) => {
        await i18n.changeLanguage(language);
        const view = render(<AuthHeader artwork title="Entrar" />);
        expect(view.UNSAFE_getByType(Image).props.accessibilityLabel).toBe(label);
    });

    it('renderiza a arte clara sem uma camada que apague a imagem', () => {
        const view = render(
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <AuthHeader artwork title="Entrar" />
            </ThemeProvider>,
        );

        expect(view.UNSAFE_getAllByType(Image)).toHaveLength(1);
        expect(
            view.UNSAFE_getAllByType(View).some(node => {
                const style = StyleSheet.flatten(node.props.style);
                return style?.position === 'absolute' && typeof style.backgroundColor === 'string' && style.backgroundColor.startsWith('rgba(');
            }),
        ).toBe(false);
    });
});
