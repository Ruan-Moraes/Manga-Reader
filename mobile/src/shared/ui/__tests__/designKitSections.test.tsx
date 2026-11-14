import { Platform, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { darkTokens, ThemeProvider } from '@/shared/theme';

import { SectionAction } from '../SectionAction';
import { SectionHeader } from '../SectionHeader';
import { TextAction } from '../TextAction';

const withTheme = (node: ReactElement) => render(<ThemeProvider initialOverride="dark">{node}</ThemeProvider>);
const touchTarget = Platform.OS === 'ios' ? 44 : 48;

const chipStyle = (testID: string) => {
    const chip = screen.getByTestId(`${testID}-chip`);

    return StyleSheet.flatten(chip.props.style);
};

describe('MOB-FEAT-057 SectionHeader e ações', () => {
    it('AC-007 mostra título, contagem em pílula e ações com área de toque mínima', () => {
        const onSort = jest.fn();
        withTheme(
            <SectionHeader title="Obras" count={5}>
                <SectionAction testID="sort" label="Recentes" icon="swap-vertical" onPress={onSort} />
            </SectionHeader>,
        );

        expect(screen.getByRole('header', { name: 'Obras' })).toBeOnTheScreen();
        expect(screen.getByText('5')).toBeOnTheScreen();
        expect(StyleSheet.flatten(screen.getByTestId('section-header-count').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: darkTokens.surfaceMuted, borderColor: darkTokens.separator, minHeight: 24 }),
        );
        // 2026-11-14: o cabeçalho não força altura; a área de toque fica nas ações, e o título fica a `sm` do conteúdo.
        expect(StyleSheet.flatten(screen.getByTestId('section-header').props.style)).toEqual(expect.objectContaining({ marginBottom: 8 }));
        expect(StyleSheet.flatten(screen.getByTestId('section-header').props.style).minHeight).toBeUndefined();

        const action = screen.getByRole('button', { name: 'Recentes' });
        expect(StyleSheet.flatten(action.props.style)).toEqual(expect.objectContaining({ minHeight: touchTarget }));
        expect(chipStyle('sort')).toEqual(expect.objectContaining({ height: 36, borderColor: darkTokens.separator }));

        fireEvent.press(action);
        expect(onSort).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['neutral', darkTokens.surfaceMuted, darkTokens.separator],
        ['accent', darkTokens.accentSoft, 'transparent'],
        ['strong', darkTokens.accent, 'transparent'],
    ] as const)('AC-007 SectionAction no tom %s', (tone, background, border) => {
        withTheme(<SectionAction testID="action" tone={tone} label="Selecionar" onPress={jest.fn()} />);

        expect(chipStyle('action')).toEqual(expect.objectContaining({ backgroundColor: background, borderColor: border, borderRadius: 999 }));
    });

    it('AC-007 sem contagem nem ações, só o título', () => {
        withTheme(<SectionHeader title="Sem obra" />);

        expect(screen.queryByTestId('section-header-count')).toBeNull();
        expect(screen.getByText('Sem obra')).toBeOnTheScreen();
    });

    it('AC-007 TextAction estende a área de toque sem deslocar o texto', () => {
        const onPress = jest.fn();
        withTheme(<TextAction label="Abrir biblioteca local" icon="library-outline" onPress={onPress} tone="muted" />);

        const action = screen.getByRole('button', { name: 'Abrir biblioteca local' });
        const style = StyleSheet.flatten(action.props.style);
        expect(style.minHeight).toBe(touchTarget);
        expect(style.marginHorizontal).toBe(-(style.paddingHorizontal as number));
        expect(StyleSheet.flatten(screen.getByText('Abrir biblioteca local').props.style)).toEqual(expect.objectContaining({ color: darkTokens.muted }));

        fireEvent.press(action);
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
