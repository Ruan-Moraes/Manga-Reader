import { Animated, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { darkTokens, ThemeProvider } from '@/shared/theme';

import { EmptyState } from '../EmptyState';
import { ListSkeleton } from '../ListSkeleton';
import { LoadingBlock } from '../LoadingBlock';
import { StateView } from '../StateView';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(),
}));

const mockedDimensions = jest.mocked(useWindowDimensions);

const withTheme = (node: ReactElement, reduceMotion = false) =>
    render(
        <ThemeProvider initialOverride="dark" reduceMotion={reduceMotion}>
            {node}
        </ThemeProvider>,
    );

beforeEach(() => {
    mockedDimensions.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 390 });
});

describe('MOB-FEAT-057 StateView', () => {
    it('AC-005 erro em tela cheia: alerta, ilustração e ação de repetir', () => {
        const retry = jest.fn();
        withTheme(
            <StateView
                kind="error"
                eyebrow="Erro"
                title="Não foi possível carregar"
                text="Verifique e tente de novo."
                retry={{ label: 'Tentar de novo', onPress: retry }}
            />,
        );

        const root = screen.getByTestId('state-view');
        expect(root.props.role).toBe('alert');
        expect(root.props.accessibilityLiveRegion).toBe('assertive');
        expect(StyleSheet.flatten(screen.getByTestId('state-view-illustration', { includeHiddenElements: true }).props.style)).toEqual(
            expect.objectContaining({ height: 140, width: 140 }),
        );
        expect(StyleSheet.flatten(screen.getByText('Erro').props.style)).toEqual(expect.objectContaining({ color: darkTokens.danger }));

        fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
        expect(retry).toHaveBeenCalledTimes(1);
    });

    it('AC-005 não encontrada exige voltar ao início e aceita voltar opcional', () => {
        const goHome = jest.fn();
        const back = jest.fn();
        withTheme(
            <StateView
                kind="notfound"
                eyebrow="Erro 404"
                title="Página não encontrada"
                goHome={{ label: 'Voltar ao início', onPress: goHome }}
                back={{ label: 'Voltar', onPress: back }}
            />,
        );

        expect(screen.getByTestId('state-view').props.role).toBe('status');
        expect(StyleSheet.flatten(screen.getByTestId('state-view-illustration', { includeHiddenElements: true }).props.style)).toEqual(
            expect.objectContaining({ height: 200 }),
        );
        fireEvent.press(screen.getByRole('button', { name: 'Voltar ao início' }));
        fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
        expect(goHome).toHaveBeenCalledTimes(1);
        expect(back).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['empty', 'transparent', darkTokens.borderStrong, 'dashed'],
        ['error', darkTokens.dangerSoft, darkTokens.danger, 'solid'],
        ['offline', 'transparent', darkTokens.separator, 'solid'],
    ] as const)('AC-005 inline %s usa superfície, borda e tipografia de bloco', (kind, background, border, borderStyle) => {
        const props = kind === 'error' ? { kind, retry: { label: 'Tentar de novo', onPress: jest.fn() } } : { kind };
        withTheme(<StateView {...props} inline title="Título" text="Texto" />);

        expect(StyleSheet.flatten(screen.getByTestId('state-view').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: background, borderColor: border, borderRadius: 16, borderStyle, borderWidth: 1 }),
        );
        expect(StyleSheet.flatten(screen.getByTestId('state-view-illustration', { includeHiddenElements: true }).props.style)).toEqual(
            expect.objectContaining({ height: 96 }),
        );
        expect(screen.getByText('Título').props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontSize: 14 })]));
    });

    it('AC-005 vazio oferece ações extras do consumidor e permite trocar ou ocultar a ilustração', () => {
        const view = withTheme(<StateView kind="empty" title="Nenhuma obra" actions={<Text>Criar obra</Text>} image={null} />);

        expect(screen.getByText('Criar obra')).toBeOnTheScreen();
        expect(screen.queryByTestId('state-view-illustration', { includeHiddenElements: true })).toBeNull();

        view.rerender(
            <ThemeProvider initialOverride="dark">
                <StateView kind="empty" title="Nenhuma obra" image={{ uri: 'file:///custom.png' }} />
            </ThemeProvider>,
        );
        expect(screen.getByTestId('state-view-illustration', { includeHiddenElements: true }).props.source).toEqual([
            expect.objectContaining({ uri: 'file:///custom.png' }),
        ]);
    });

    it('AC-005 ações obrigatórias são impostas pelos tipos', () => {
        // @ts-expect-error erro sem ação de repetir não compila
        const missingRetry = <StateView kind="error" title="Falhou" />;
        // @ts-expect-error não encontrada sem voltar ao início não compila
        const missingHome = <StateView kind="notfound" title="404" />;

        expect(missingRetry).toBeTruthy();
        expect(missingHome).toBeTruthy();
    });

    it.each([[{ fontScale: 2, height: 800 }], [{ fontScale: 1, height: 560 }]])(
        'AC-014 oculta a ilustração com fonte ampliada ou pouca altura sem perder título e ação (%o)',
        dimensions => {
            mockedDimensions.mockReturnValue({ ...dimensions, scale: 2, width: 320 });
            withTheme(<StateView kind="error" title="Falhou" retry={{ label: 'Tentar de novo', onPress: jest.fn() }} />);

            expect(screen.queryByTestId('state-view-illustration', { includeHiddenElements: true })).toBeNull();
            expect(screen.getByText('Falhou')).toBeOnTheScreen();
            expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeOnTheScreen();
        },
    );

    it('AC-005 EmptyState continua compatível', () => {
        withTheme(<EmptyState title="Em breve" description="Ainda não disponível" action={<Text>Ação</Text>} />);

        expect(screen.getByText('Em breve')).toBeOnTheScreen();
        expect(screen.getByText('Ainda não disponível')).toBeOnTheScreen();
        expect(screen.getByText('Ação')).toBeOnTheScreen();
    });
});

describe('MOB-FEAT-057 carregamento', () => {
    it('AC-006 LoadingBlock é anunciado como status com rótulo', () => {
        withTheme(<LoadingBlock label="Carregando capítulo" inline />);

        const block = screen.getByTestId('loading-block');
        expect(block.props.role).toBe('status');
        expect(block.props.accessibilityLabel).toBe('Carregando capítulo');
        expect(screen.getByText('Carregando capítulo')).toBeOnTheScreen();
    });

    it('AC-006 ListSkeleton desenha linhas de 64 com rótulo acessível', () => {
        withTheme(<ListSkeleton label="Carregando lista" rows={3} />);

        const skeleton = screen.getByTestId('list-skeleton');
        expect(skeleton.props.role).toBe('status');
        expect(skeleton.props.accessibilityLabel).toBe('Carregando lista');

        const rows = screen.getAllByTestId('list-skeleton-row');
        expect(rows).toHaveLength(3);
        expect(StyleSheet.flatten(rows[0].props.style)).toEqual(expect.objectContaining({ gap: 12, minHeight: 64 }));
    });

    it('AC-006 o pulso fica estático com movimento reduzido', () => {
        const loop = jest.spyOn(Animated, 'loop');
        withTheme(<ListSkeleton label="Carregando lista" rows={1} />, true);

        expect(loop).not.toHaveBeenCalled();
    });
});
