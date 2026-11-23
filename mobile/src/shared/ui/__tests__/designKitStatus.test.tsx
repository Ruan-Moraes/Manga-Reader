import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { lightTokens, ThemeProvider } from '@/shared/theme';

import { StatusMessage } from '../StatusMessage';

describe('MOB-FEAT-057 StatusMessage', () => {
    it.each([
        ['danger', lightTokens.dangerSoft, lightTokens.danger],
        ['warning', lightTokens.warnSoft, lightTokens.warn],
        ['success', lightTokens.successSoft, lightTokens.success],
        ['info', lightTokens.surfaceSelected, lightTokens.accentText],
        ['loading', lightTokens.surfaceSelected, lightTokens.accentText],
    ] as const)('AC-002 usa a superfície suave do tom %s mantendo a borda do tom', (tone, surface, border) => {
        render(
            <ThemeProvider initialOverride="light">
                <StatusMessage title="Título" description="Descrição" tone={tone} />
            </ThemeProvider>,
        );

        const style = StyleSheet.flatten(screen.getByTestId('status-message').props.style);

        expect(style).toMatchObject({ backgroundColor: surface, borderColor: border, borderWidth: 1 });
    });
});
