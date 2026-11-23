import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/shared/theme';

import { ActionSheet } from '../ActionSheet';
import { ConfirmSheet } from '../ConfirmSheet';
import { ListRow } from '../ListRow';
import { SectionAction } from '../SectionAction';
import { SectionHeader } from '../SectionHeader';
import { SegmentedControl } from '../SegmentedControl';
import { StateView } from '../StateView';
import { TextAction } from '../TextAction';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(),
}));

const mockedDimensions = jest.mocked(useWindowDimensions);
const touchTarget = Platform.OS === 'ios' ? 44 : 48;

const renderLarge = (node: ReactElement, highContrast = false) =>
    render(
        <ThemeProvider initialOverride="light" density="COMPACT" highContrast={highContrast} reduceMotion>
            {node}
        </ThemeProvider>,
    );

beforeEach(() => {
    mockedDimensions.mockReturnValue({ fontScale: 2, height: 568, scale: 2, width: 320 });
});

describe('MOB-FEAT-057 acessibilidade e responsividade', () => {
    it('AC-014 escala o texto a 200% e mantém título, contagem e ações operáveis', () => {
        renderLarge(
            <SectionHeader title="Capítulos da obra com um nome longo" count="12 capítulos">
                <SectionAction label="Novo" icon="add" tone="accent" onPress={jest.fn()} />
            </SectionHeader>,
        );

        const title = screen.getByRole('header', { name: 'Capítulos da obra com um nome longo' });
        expect(StyleSheet.flatten(title.props.style).fontSize).toBe(40);
        expect(screen.getByText('12 capítulos')).toBeOnTheScreen();
        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Novo' }).props.style).minHeight).toBe(touchTarget);
    });

    it('AC-014 segmentado empilha com fonte ampliada sem perder a área de toque', () => {
        renderLarge(
            <SegmentedControl label="Densidade" value="A" options={['A', 'B'] as const} optionLabel={option => `Opção ${option}`} onChange={jest.fn()} />,
        );

        const option = screen.getByRole('radio', { name: 'Opção B' });
        expect(StyleSheet.flatten(option.props.style)).toEqual(expect.objectContaining({ minHeight: touchTarget, width: '100%' }));
    });

    it('AC-014 estado em tela pequena, alto contraste e movimento reduzido mantém título, texto e ação', () => {
        renderLarge(
            <StateView
                kind="notfound"
                eyebrow="Erro 404"
                title="Página não encontrada"
                text="Volte ao início."
                goHome={{ label: 'Voltar ao início', onPress: jest.fn() }}
            />,
            true,
        );

        expect(screen.queryByTestId('state-view-illustration', { includeHiddenElements: true })).toBeNull();
        expect(screen.getByText('Página não encontrada')).toBeOnTheScreen();
        expect(screen.getByText('Volte ao início.')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Voltar ao início' })).toBeOnTheScreen();
    });

    it('AC-014 folhas de ação e confirmação continuam completas com fonte ampliada', () => {
        renderLarge(
            <>
                <ActionSheet
                    visible
                    onClose={jest.fn()}
                    closeLabel="Fechar"
                    cancelLabel="Cancelar"
                    title="Capítulo 4 — O retorno do herói"
                    actions={[{ key: 'rename', label: 'Renomear capítulo', icon: 'create-outline', onPress: jest.fn() }]}
                />
                <ConfirmSheet
                    visible
                    onClose={jest.fn()}
                    onConfirm={jest.fn()}
                    closeLabel="Fechar confirmação"
                    cancelLabel="Manter"
                    confirmLabel="Excluir capítulo"
                    title="Excluir capítulo?"
                />
            </>,
        );

        expect(StyleSheet.flatten(screen.getByTestId('action-sheet-action-rename').props.style).minHeight).toBeGreaterThanOrEqual(touchTarget);
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Excluir capítulo' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Manter' })).toBeOnTheScreen();
    });

    it('AC-014 linhas e ações textuais mantêm alvos mínimos em 320 pt', () => {
        renderLarge(
            <>
                <ListRow title="Privacidade" description="Visibilidade e rastreamento" icon="shield-checkmark-outline" onPress={jest.fn()} />
                <TextAction label="Abrir biblioteca local" onPress={jest.fn()} />
            </>,
        );

        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Privacidade' }).props.style).minHeight).toBe(64);
        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Abrir biblioteca local' }).props.style).minHeight).toBe(touchTarget);
    });
});
