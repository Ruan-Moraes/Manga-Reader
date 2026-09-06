import { View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

import { MediaPreviewSheet } from '../MediaPreviewSheet';

jest.mock('@expo/vector-icons', () => {
    const { View: MockView } = jest.requireActual('react-native');

    return { Ionicons: (props: object) => <MockView {...props} /> };
});
jest.mock('expo-image', () => {
    const { View: MockView } = jest.requireActual('react-native');

    return { Image: (props: object) => <MockView {...props} /> };
});

const mockStatusBar = jest.fn((_props: object) => null);

jest.mock('expo-status-bar', () => ({ StatusBar: (props: object) => mockStatusBar(props) }));

const renderPreview = (props?: Partial<React.ComponentProps<typeof MediaPreviewSheet>>) =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
            <ThemeProvider initialOverride="light" waitForPlatform={false}>
                <MediaPreviewSheet
                    visible
                    uri="file:///private/page-1.png"
                    eyebrow="Página 1 de 2"
                    title="Visualizar imagem"
                    imageAccessibilityLabel="Imagem ampliada da página 1 de 2"
                    unavailableAccessibilityLabel="Prévia indisponível"
                    closeAccessibilityLabel="Fechar"
                    closeLabel="Fechar"
                    onClose={jest.fn()}
                    imageTestID="preview-image"
                    {...props}
                />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

describe('MediaPreviewSheet', () => {
    it('renders a private contained image with disk cache and optional content', () => {
        renderPreview({ details: <View testID="details" />, actions: <View testID="actions" /> });

        const image = screen.getByTestId('preview-image');
        expect(image.props.source).toEqual({ uri: 'file:///private/page-1.png' });
        expect(image.props.contentFit).toBe('contain');
        expect(image.props.contentPosition).toBe('top');
        expect(image.props.cachePolicy).toBe('memory-disk');
        expect(screen.getByTestId('details')).toBeOnTheScreen();
        expect(screen.getByTestId('actions')).toBeOnTheScreen();
        expect(screen.queryByText(/file:\/\//)).toBeNull();
        expect(mockStatusBar).toHaveBeenLastCalledWith({ animated: true, hidden: false, style: 'dark' });
    });

    it('closes from the header and footer actions', () => {
        const onClose = jest.fn();
        renderPreview({ onClose });

        const closeActions = screen.getAllByRole('button', { name: 'Fechar' });
        fireEvent.press(closeActions[0]);
        fireEvent.press(closeActions[1]);

        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('shows an accessible fallback and resets it when the source changes', () => {
        const view = renderPreview();
        fireEvent(screen.getByTestId('preview-image'), 'error');
        expect(screen.getByLabelText('Prévia indisponível')).toBeOnTheScreen();

        view.rerender(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
                <ThemeProvider initialOverride="light" waitForPlatform={false}>
                    <MediaPreviewSheet
                        visible
                        uri="file:///private/page-2.png"
                        eyebrow="Página 2 de 2"
                        title="Visualizar imagem"
                        imageAccessibilityLabel="Imagem ampliada da página 2 de 2"
                        unavailableAccessibilityLabel="Prévia indisponível"
                        closeAccessibilityLabel="Fechar"
                        closeLabel="Fechar"
                        onClose={jest.fn()}
                        imageTestID="preview-image"
                    />
                </ThemeProvider>
            </SafeAreaProvider>,
        );

        expect(screen.getByTestId('preview-image').props.source).toEqual({ uri: 'file:///private/page-2.png' });
    });
});
