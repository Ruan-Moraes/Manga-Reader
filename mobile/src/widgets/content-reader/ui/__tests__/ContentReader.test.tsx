import { useState } from 'react';
import { AccessibilityInfo, FlatList, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEFAULT_TEXT_READER_PREFERENCES, DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import i18n from '@/shared/i18n';
import { darkTokens, lightTokens, ThemeProvider } from '@/shared/theme';

import { type ImageSequenceDocument, type ReaderLocation, type TextFlowDocument } from '../../model/contentReader';
import { ContentReader } from '../ContentReader';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const imageDocument: ImageSequenceDocument = {
    kind: 'IMAGE_SEQUENCE',
    id: 'demo',
    title: 'Capítulo demo',
    sourceKind: 'DEMO',
    items: [
        {
            id: 'p1',
            primaryUri: 'result-1',
            originalUri: 'original-1',
            width: 800,
            height: 1200,
            demoOverlays: [
                {
                    id: 'r1',
                    translatedText: 'Texto traduzido',
                    overflow: false,
                    vertices: [
                        { index: 0, x: 0.1, y: 0.1 },
                        { index: 1, x: 0.9, y: 0.1 },
                        { index: 2, x: 0.9, y: 0.2 },
                        { index: 3, x: 0.1, y: 0.2 },
                    ],
                },
            ],
        },
        { id: 'p2', primaryUri: 'result-2', originalUri: 'original-2', width: 800, height: 1600 },
    ],
};

const textDocument: TextFlowDocument = {
    kind: 'TEXT_FLOW',
    id: 'novel',
    title: 'Novel',
    blocks: [
        { id: 'h', type: 'heading', text: 'Heading' },
        { id: 'p', type: 'paragraph', text: 'Paragraph' },
        { id: 'd', type: 'dialogue', speaker: 'Lira', text: 'Dialogue' },
        { id: 'x', type: 'divider' },
        { id: 'i', type: 'image', uri: 'editorial', width: 2, height: 1, description: 'Editorial' },
    ],
};

const withTheme = (node: React.ReactNode, reveal = true) => {
    const screen = render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 750, height: 1334 }, insets: { top: 20, right: 0, bottom: 20, left: 0 } }}>
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                {node}
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    if (reveal) fireEvent(screen.getByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    return screen;
};

describe('MOB-FEAT-051 content reader', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it.each([10, 67, 200])('keeps the same bounded list configuration with %i synthetic pages', count => {
        const document = {
            ...imageDocument,
            items: Array.from({ length: count }, (_, index) => ({ ...imageDocument.items[index % 2], id: `synthetic-${index}` })),
        };
        const screen = withTheme(<ContentReader document={document} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        const list = screen.getByTestId('reader-vertical');
        expect(list.props.data).toHaveLength(count);
        expect(list.props.windowSize).toBe(5);
        expect(list.props.maxToRenderPerBatch).toBe(3);
    });

    it('keeps the exit callback and native panel dismissal available', () => {
        const onExit = jest.fn();
        const screen = withTheme(
            <ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={onExit} controlsContent={<Text>Settings fixture</Text>} />,
        );
        fireEvent.press(screen.getByRole('button', { name: 'Sair do leitor' }));
        expect(onExit).toHaveBeenCalledTimes(1);
        fireEvent.press(screen.getByRole('button', { name: 'Configurações do leitor' }));
        fireEvent(screen.getByTestId('reader-panel'), 'requestClose');
        expect(screen.queryByText('Settings fixture')).toBeNull();
    });

    it('restores hydrated locations and retains the relative offset when resized', () => {
        const scroll = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        let hydrate: (location: ReaderLocation) => void = () => undefined;
        function Harness() {
            const [location, setLocation] = useState({ itemId: 'p1', index: 0 });
            hydrate = setLocation;
            return (
                <ContentReader
                    document={imageDocument}
                    settings={DEFAULT_USER_SETTINGS.reader}
                    location={location}
                    onLocationChange={setLocation}
                    onExit={jest.fn()}
                />
            );
        }
        const screen = withTheme(<Harness />);
        const list = screen.getByTestId('reader-vertical');
        fireEvent(list, 'layout', { nativeEvent: { layout: { width: 320, height: 640, x: 0, y: 0 } } });
        act(() => hydrate({ itemId: 'p2', index: 1 }));
        expect(scroll).toHaveBeenLastCalledWith({ offset: 480, animated: false });
        fireEvent.scroll(list, {
            nativeEvent: { contentOffset: { y: 544 }, layoutMeasurement: { width: 320, height: 640 }, contentSize: { width: 320, height: 1120 } },
        });
        fireEvent(list, 'layout', { nativeEvent: { layout: { width: 640, height: 320, x: 0, y: 0 } } });
        expect(scroll).toHaveBeenLastCalledWith({ offset: 1088, animated: false });
        scroll.mockRestore();
    });

    it('uses theme surfaces for both bars and a light demonstration mask', () => {
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        expect(screen.getByTestId('reader-top-bar')).toHaveStyle({ backgroundColor: darkTokens.surface });
        expect(screen.getByTestId('reader-bottom-bar')).toHaveStyle({ backgroundColor: darkTokens.surface });
        expect(screen.getByTestId('reader-demo-overlay-r1')).toHaveStyle({ backgroundColor: lightTokens.surface });
    });

    it('provides explicit controls and cancels an out-and-back drag', () => {
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        const surface = screen.getByTestId('reader-touch-surface');
        fireEvent(surface, 'touchStart', { nativeEvent: { pageX: 10, pageY: 10 } });
        fireEvent(surface, 'touchMove', { nativeEvent: { pageX: 10, pageY: 80 } });
        fireEvent(surface, 'touchEnd', { nativeEvent: { pageX: 10, pageY: 10 } });
        expect(screen.getByTestId('reader-top-bar')).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Ocultar controles' }));
        expect(screen.queryByTestId('reader-top-bar')).toBeNull();
        fireEvent(screen.getByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
        expect(screen.getByTestId('reader-top-bar')).toBeTruthy();
    });

    it('opens a settings modal with an explicit close action', () => {
        const screen = withTheme(
            <ContentReader
                document={imageDocument}
                settings={DEFAULT_USER_SETTINGS.reader}
                onExit={jest.fn()}
                controlsContent={<Text>Settings fixture</Text>}
            />,
        );
        expect(screen.queryByText('Settings fixture')).toBeNull();
        fireEvent.press(screen.getByRole('button', { name: 'Configurações do leitor' }));
        expect(screen.getByText('Settings fixture')).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Fechar seleção' }));
        expect(screen.queryByText('Settings fixture')).toBeNull();
    });

    it('measures the viewport without changing page geometry on load or error', () => {
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        fireEvent(screen.getByTestId('reader-vertical'), 'layout', { nativeEvent: { layout: { width: 320, height: 640, x: 0, y: 0 } } });
        expect(screen.getByTestId('reader-page-p1')).toHaveStyle({ width: 320, height: 480 });
        fireEvent(screen.getAllByLabelText('Página traduzida')[0], 'error', { nativeEvent: { error: 'failed' } });
        expect(screen.getByTestId('reader-page-p1')).toHaveStyle({ width: 320, height: 480 });
    });

    it('disables next on the final odd spread and previous on the first spread', () => {
        const odd = { ...imageDocument, items: [...imageDocument.items, { ...imageDocument.items[1], id: 'p3' }] };
        const screen = withTheme(
            <ContentReader
                document={odd}
                settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'DOUBLE', direction: 'LTR' }}
                location={{ itemId: 'p3', index: 2 }}
                onExit={jest.fn()}
            />,
        );
        expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled();
    });

    it('recovers a published image without a local integrity callback', () => {
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        fireEvent(screen.getAllByLabelText('Página traduzida')[0], 'error', { nativeEvent: { error: 'failed' } });
        expect(screen.getByTestId('reader-page-error-p1')).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
        expect(screen.queryByTestId('reader-page-error-p1')).toBeNull();
        expect(screen.getByTestId('reader-page-p1')).toBeTruthy();
    });

    it('offers localized recovery for a failed original', () => {
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        fireEvent.press(screen.getByRole('button', { name: 'Configurações do leitor' }));
        fireEvent.press(screen.getByRole('button', { name: 'Ver original' }));
        fireEvent(screen.getAllByLabelText('Página original')[0], 'error', { nativeEvent: { error: 'failed' } });
        expect(screen.getByTestId('reader-page-error-p1')).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));
        expect(screen.queryByTestId('reader-page-error-p1')).toBeNull();
    });

    it('does not offer mixed original/result comparison', () => {
        const partial = { ...imageDocument, items: [imageDocument.items[0], { ...imageDocument.items[1], originalUri: null }] };
        const screen = withTheme(<ContentReader document={partial} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        expect(screen.queryByRole('button', { name: 'Ver original' })).toBeNull();
    });

    it('renders a virtualized full-width continuous sequence and demo overlay without source panel', () => {
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />);
        const list = screen.getByTestId('reader-vertical');
        expect(list.props.initialNumToRender).toBe(3);
        expect(list.props.windowSize).toBe(5);
        expect(screen.getByTestId('reader-page-p1').props.style.width).toBe(750);
        expect(screen.getByTestId('reader-demo-overlay-r1').props.style.overflow).toBe('hidden');
        expect(screen.getByText('Texto traduzido')).toBeTruthy();
        expect(screen.queryByText('Texto identificado')).toBeNull();
    });

    it('toggles the whole document to original without replacing the current location', () => {
        const onLocationChange = jest.fn();
        const screen = withTheme(
            <ContentReader
                document={imageDocument}
                settings={DEFAULT_USER_SETTINGS.reader}
                location={{ itemId: 'p2', index: 1 }}
                onExit={jest.fn()}
                onLocationChange={onLocationChange}
            />,
        );
        expect(screen.getByText('Página 2 de 2')).toBeTruthy();
        fireEvent.press(screen.getByRole('button', { name: 'Configurações do leitor' }));
        fireEvent.press(screen.getByRole('button', { name: 'Ver original' }));
        expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeTruthy();
        expect(screen.getByText('Página 2 de 2')).toBeTruthy();
        expect(screen.queryByTestId('reader-demo-overlay-r1')).toBeNull();
    });

    it('preserves paged and double modes for image content', () => {
        const screen = withTheme(
            <ContentReader document={imageDocument} settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'PAGED', direction: 'LTR' }} onExit={jest.fn()} />,
        );
        expect(screen.getByTestId('reader-paged')).toBeTruthy();
        screen.rerender(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 750, height: 1334 }, insets: { top: 20, right: 0, bottom: 20, left: 0 } }}>
                <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                    <ContentReader
                        document={imageDocument}
                        settings={{ ...DEFAULT_USER_SETTINGS.reader, mode: 'DOUBLE', direction: 'RTL' }}
                        onExit={jest.fn()}
                    />
                </ThemeProvider>
            </SafeAreaProvider>,
        );
        expect(screen.getAllByTestId(/reader-page-/)).toHaveLength(2);
    });

    it('renders every textual block type without image-only controls', () => {
        const screen = withTheme(<ContentReader document={textDocument} onExit={jest.fn()} />);
        expect(screen.getByTestId('reader-text-flow')).toBeTruthy();
        expect(screen.getByText('Heading').props.allowFontScaling).toBe(true);
        expect(screen.getByText('Paragraph')).toBeTruthy();
        expect(screen.getByText('Dialogue')).toBeTruthy();
        expect(screen.getByLabelText('Editorial')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ver original' })).toBeNull();
    });

    it('validates only viewable items and isolates a damaged page', async () => {
        const validate = jest.fn(async (id: string) => id !== 'p1');
        const screen = withTheme(
            <ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} onValidateItem={validate} />,
        );
        const list = screen.getByTestId('reader-vertical');
        await act(async () => {
            list.props.onViewableItemsChanged({ viewableItems: [{ item: imageDocument.items[0], index: 0, isViewable: true }] });
        });
        await screen.findByTestId('reader-page-error-p1');
        expect(validate).toHaveBeenCalledWith('p1');
        expect(validate).not.toHaveBeenCalledWith('p2');
        expect(screen.getByTestId('reader-page-p2')).toBeTruthy();
    });
    it('starts hidden and keeps list identity, layout and offset unchanged while toggling', () => {
        const scroll = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />, false);
        expect(screen.queryByTestId('reader-top-bar')).toBeNull();
        const list = screen.getByTestId('reader-vertical');
        const layout = list.props.getItemLayout;
        const pageStyle = screen.getByTestId('reader-page-p1').props.style;
        scroll.mockClear();
        fireEvent(screen.getByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
        expect(screen.getByTestId('reader-top-bar')).toBeTruthy();
        expect(screen.getByTestId('reader-vertical')).toBe(list);
        expect(screen.getByTestId('reader-vertical').props.getItemLayout).toBe(layout);
        expect(screen.getByTestId('reader-page-p1').props.style).toEqual(pageStyle);
        expect(scroll).not.toHaveBeenCalled();
        fireEvent(screen.getByTestId('reader-vertical'), 'scrollBeginDrag');
        expect(screen.queryByTestId('reader-top-bar')).toBeNull();
        fireEvent(screen.getByTestId('reader-vertical'), 'momentumScrollEnd');
        expect(screen.queryByTestId('reader-top-bar')).toBeNull();
        expect(scroll).not.toHaveBeenCalled();
        scroll.mockRestore();
    });

    it('provides a focusable reveal button when a screen reader is enabled', async () => {
        jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
        const screen = withTheme(<ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />, false);
        fireEvent.press(await screen.findByRole('button', { name: 'Mostrar controles' }));
        expect(screen.getByTestId('reader-top-bar')).toBeTruthy();
        expect(screen.queryByTestId('reader-reveal-region')).toBeNull();
    });

    it.each(['light', 'dark'] as const)('uses responsive high-contrast bars in %s without moving images', scheme => {
        const screen = render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 568 }, insets: { top: 24, right: 12, bottom: 20, left: 12 } }}>
                <ThemeProvider initialOverride={scheme} highContrast reduceMotion waitForPlatform={false}>
                    <ContentReader document={imageDocument} settings={DEFAULT_USER_SETTINGS.reader} onExit={jest.fn()} />
                </ThemeProvider>
            </SafeAreaProvider>,
        );
        fireEvent(screen.getByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
        const surface = scheme === 'light' ? '#ffffff' : '#181818';
        expect(screen.getByTestId('reader-top-bar')).toHaveStyle({ backgroundColor: surface, paddingTop: 24, position: 'absolute' });
        expect(screen.getByTestId('reader-bottom-bar')).toHaveStyle({ backgroundColor: surface, paddingBottom: 20, position: 'absolute' });
        expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 2, now: 1 });
    });
    it('MOB-FEAT-053 scopes a light text palette to its bars and keeps text geometry when toggling', () => {
        const move = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => undefined);
        const screen = withTheme(
            <ContentReader document={textDocument} textPreferences={{ ...DEFAULT_TEXT_READER_PREFERENCES, background: 'LIGHT' }} onExit={jest.fn()} />,
            false,
        );
        const list = screen.getByTestId('reader-text-flow');
        const geometry = list.props.contentContainerStyle;
        move.mockClear();
        fireEvent(screen.getByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
        expect(screen.getByTestId('reader-top-bar')).toHaveStyle({ backgroundColor: lightTokens.surface });
        expect(screen.getByTestId('reader-bottom-bar')).toHaveStyle({ backgroundColor: lightTokens.surface });
        expect(screen.getByText('0% lido')).toBeTruthy();
        expect(screen.getByTestId('reader-text-flow')).toBe(list);
        expect(list.props.contentContainerStyle).toEqual(geometry);
        expect(move).not.toHaveBeenCalled();
        move.mockRestore();
    });
});

it('preserva viewport e comparação ao trocar categorias e reabrir o painel', () => {
    const screen = withTheme(
        <ContentReader
            document={imageDocument}
            settings={DEFAULT_USER_SETTINGS.reader}
            onExit={jest.fn()}
            controlSections={[
                { id: 'reading', title: 'Leitura', content: <Text>Ajustes de leitura</Text> },
                { id: 'appearance', title: 'Aparência', content: <Text>Ajustes visuais</Text> },
            ]}
        />,
    );
    const viewport = screen.getByTestId('reader-vertical');
    fireEvent.press(screen.getByRole('button', { name: 'Configurações do leitor' }));
    expect(screen.queryByRole('button', { name: 'Ver original' })).toBeNull();
    fireEvent.press(screen.getByRole('tab', { name: 'Aparência' }));
    fireEvent.press(screen.getByRole('button', { name: 'Ver original' }));
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeOnTheScreen();
    fireEvent(screen.getByTestId('reader-panel'), 'requestClose');
    expect(screen.getByTestId('reader-vertical')).toBe(viewport);
    fireEvent.press(screen.getByRole('button', { name: 'Configurações do leitor' }));
    expect(screen.getByRole('tab', { name: 'Aparência' })).toBeSelected();
});
