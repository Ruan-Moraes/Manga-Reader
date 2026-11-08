import { Modal, StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/shared/theme';

import { ActionSheet } from '../ActionSheet';
import { BottomSheet, resolveBottomSheetMaxHeight } from '../BottomSheet';
import { ConfirmSheet } from '../ConfirmSheet';

const withTheme = (node: ReactElement, reduceMotion = false) =>
    render(
        <ThemeProvider initialOverride="dark" reduceMotion={reduceMotion}>
            {node}
        </ThemeProvider>,
    );

describe('MOB-FEAT-057 BottomSheet', () => {
    it('AC-003 limita a altura à área segura sem valores negativos', () => {
        expect(resolveBottomSheetMaxHeight(800, 40)).toBeCloseTo(646);
        expect(resolveBottomSheetMaxHeight(800, 40, 0.82)).toBeCloseTo(623.2);
        expect(resolveBottomSheetMaxHeight(-10, 40)).toBe(0);
        expect(resolveBottomSheetMaxHeight(Number.NaN, Number.NaN)).toBe(0);
        expect(resolveBottomSheetMaxHeight(100, 300)).toBe(0);
    });

    it('AC-003 apresenta cabeçalho, corpo e rodapé e fecha por botão, scrim, escape e voltar', () => {
        const onClose = jest.fn();
        withTheme(
            <BottomSheet visible onClose={onClose} closeLabel="Fechar" title="Ajustes" description="Valem na hora." footer={<Text>Rodapé</Text>}>
                <Text>Corpo</Text>
            </BottomSheet>,
        );

        expect(screen.getByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
        expect(screen.getByText('Valem na hora.')).toBeOnTheScreen();
        expect(screen.getByText('Corpo')).toBeOnTheScreen();
        expect(StyleSheet.flatten(screen.getByTestId('bottom-sheet-footer').props.style)).toEqual(
            expect.objectContaining({ borderTopWidth: 1, paddingTop: 16 }),
        );

        const sheet = StyleSheet.flatten(screen.getByTestId('bottom-sheet').props.style);
        expect(sheet).toEqual(expect.objectContaining({ borderTopLeftRadius: 24, borderTopRightRadius: 24, bottom: 0, left: 0, right: 0 }));
        expect(sheet.maxHeight).toBeGreaterThan(0);
        expect(StyleSheet.flatten(screen.getByTestId('bottom-sheet-scroll').props.contentContainerStyle)).toEqual(
            expect.objectContaining({ gap: 24, paddingTop: 24 }),
        );

        const closeButtons = screen.getAllByRole('button', { name: 'Fechar' });
        expect(closeButtons.length).toBe(2);

        fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));
        fireEvent(screen.getByTestId('bottom-sheet-layer'), 'accessibilityEscape');
        act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
        fireEvent.press(closeButtons[1]);

        expect(onClose).toHaveBeenCalledTimes(4);
    });

    it('AC-003 abre sem animação com movimento reduzido e respeita altura fixa limitada', () => {
        withTheme(
            <BottomSheet visible onClose={jest.fn()} closeLabel="Fechar" height={5000}>
                <Text>Corpo</Text>
            </BottomSheet>,
            true,
        );

        expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');

        const sheet = StyleSheet.flatten(screen.getByTestId('bottom-sheet').props.style);
        expect(sheet.height).toBe(sheet.maxHeight);
        expect(screen.queryByTestId('bottom-sheet-footer')).toBeNull();
    });

    it('AC-003 abre e fecha sem conteúdo', () => {
        const view = withTheme(<BottomSheet visible onClose={jest.fn()} closeLabel="Fechar" />);

        expect(screen.getByTestId('bottom-sheet')).toBeOnTheScreen();
        view.rerender(
            <ThemeProvider initialOverride="dark">
                <BottomSheet visible={false} onClose={jest.fn()} closeLabel="Fechar" />
            </ThemeProvider>,
        );
        expect(screen.queryByTestId('bottom-sheet')).toBeNull();
    });
});

describe('MOB-FEAT-057 ActionSheet', () => {
    it('AC-004 fecha antes de executar a ação e separa as destrutivas', () => {
        const calls: string[] = [];
        const onClose = jest.fn(() => calls.push('close'));
        withTheme(
            <ActionSheet
                visible
                onClose={onClose}
                closeLabel="Fechar"
                cancelLabel="Cancelar"
                title="Obra"
                subtitle="3 capítulos"
                actions={[
                    { key: 'open', label: 'Abrir obra', icon: 'book-outline', onPress: () => calls.push('open') },
                    { key: 'delete', label: 'Excluir obra', icon: 'trash-outline', destructive: true, onPress: () => calls.push('delete') },
                ]}
            />,
        );

        expect(screen.getByTestId('action-sheet-group')).toContainElement(screen.getByTestId('action-sheet-action-open'));
        expect(screen.getByTestId('action-sheet-destructive-group')).toContainElement(screen.getByTestId('action-sheet-action-delete'));

        fireEvent.press(screen.getByTestId('action-sheet-action-open'));
        expect(calls).toEqual(['close', 'open']);

        const height = StyleSheet.flatten(screen.getByTestId('action-sheet-action-delete').props.style).minHeight;
        expect(height).toBeGreaterThanOrEqual(52);
    });

    it('AC-004 cancelar, scrim e voltar nunca executam ações', () => {
        const onPress = jest.fn();
        const onClose = jest.fn();
        withTheme(
            <ActionSheet
                visible
                onClose={onClose}
                closeLabel="Fechar"
                cancelLabel="Cancelar"
                actions={[{ key: 'delete', label: 'Excluir', destructive: true, onPress }]}
            />,
        );

        fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
        fireEvent.press(screen.getByTestId('action-sheet-backdrop'));
        act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());

        expect(onClose).toHaveBeenCalledTimes(3);
        expect(onPress).not.toHaveBeenCalled();
    });
});

describe('MOB-FEAT-057 ConfirmSheet', () => {
    const renderConfirm = (onClose = jest.fn(), onConfirm = jest.fn()) => {
        withTheme(
            <ConfirmSheet
                visible
                onClose={onClose}
                onConfirm={onConfirm}
                closeLabel="Fechar"
                cancelLabel="Cancelar"
                confirmLabel="Excluir obra"
                title="Excluir A Lâmina?"
                description="Isso não pode ser desfeito."
                itemsTitle="Será removido"
                items={['Capítulos e páginas', 'Progresso de leitura']}
            />,
        );

        return { onClose, onConfirm };
    };

    it('AC-004 lista o que será removido e confirma só pelo botão destrutivo', () => {
        const calls: string[] = [];
        renderConfirm(
            jest.fn(() => calls.push('close')),
            jest.fn(() => calls.push('confirm')),
        );

        expect(screen.getByRole('header', { name: 'Excluir A Lâmina?' })).toBeOnTheScreen();
        expect(screen.getByText('Capítulos e páginas')).toBeOnTheScreen();
        expect(screen.getByText('Será removido')).toBeOnTheScreen();

        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        expect(calls).toEqual(['close', 'confirm']);
    });

    it('AC-004 cancelar, fechar, scrim e voltar não confirmam', () => {
        const { onClose, onConfirm } = renderConfirm();

        fireEvent.press(screen.getByTestId('confirm-sheet-cancel'));
        fireEvent.press(screen.getByTestId('confirm-sheet-backdrop'));
        fireEvent(screen.getByTestId('confirm-sheet-layer'), 'accessibilityEscape');
        act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());

        expect(onClose).toHaveBeenCalledTimes(4);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
