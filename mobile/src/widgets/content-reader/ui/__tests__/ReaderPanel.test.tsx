import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { ReaderPanel } from '../ReaderPanel';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ default: jest.fn(() => ({ width: 390, height: 844, scale: 1, fontScale: 1 })) }));

beforeEach(() => {
    void i18n.changeLanguage('pt-BR');
    jest.mocked(useWindowDimensions).mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 });
});

function panel(onClose = jest.fn()) {
    const sections = [
        { id: 'reading', title: 'Leitura', content: <Text>Modo de leitura</Text> },
        { id: 'appearance', title: 'Aparência', content: <Text>Cor da página</Text> },
    ];
    const node = (visible: boolean) => (
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 20, bottom: 20, left: 0, right: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <ReaderPanel visible={visible} title="Ajustes" onClose={onClose} sections={sections} />
            </ThemeProvider>
        </SafeAreaProvider>
    );
    return { ...render(node(true)), node, onClose };
}

it('lembra a categoria ao fechar e reabrir sem mostrar conteúdo de outras abas', () => {
    const screen = panel();
    expect(screen.getByText('Modo de leitura')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('tab', { name: 'Aparência' }));
    expect(screen.queryByText('Modo de leitura')).toBeNull();
    screen.rerender(screen.node(false));
    screen.rerender(screen.node(true));
    expect(screen.getByText('Cor da página')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Aparência' })).toBeSelected();
});

it('oferece expansão e fechamento por backdrop e Android', () => {
    const screen = panel();
    fireEvent.press(screen.getByRole('button', { name: 'Expandir painel' }));
    expect(screen.getByRole('button', { name: 'Recolher painel' })).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('reader-panel-backdrop', { includeHiddenElements: true }));
    fireEvent(screen.getByTestId('reader-panel'), 'requestClose');
    expect(screen.onClose).toHaveBeenCalledTimes(2);
});

it.each([
    { height: 844, fontScale: 1.8 },
    { height: 500, fontScale: 1 },
])('expande automaticamente com %o', dimensions => {
    jest.mocked(useWindowDimensions).mockReturnValue({ width: 390, scale: 1, ...dimensions });
    const screen = panel();
    expect(screen.queryByRole('button', { name: 'Expandir painel' })).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('reader-panel-sheet').props.style).height).toBe(dimensions.height - 20);
    expect(screen.getByRole('tab', { name: 'Aparência' })).toBeOnTheScreen();
});
