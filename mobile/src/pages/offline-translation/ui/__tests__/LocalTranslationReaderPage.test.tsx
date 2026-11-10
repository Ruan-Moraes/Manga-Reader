import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalTranslationReaderSnapshot, OpenLocalTranslationResultController, TrackLocalReadingProgressController } from '@/features/local-translation';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { LocalTranslationReaderPage } from '../LocalTranslationReaderPage';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/widgets/remote-processing', () => ({
    BatchRetrySheet: () => null,
    PageRetryIndicator: ({ pageId }: { pageId: string }) => {
        const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
        return <Text testID="page-retry-indicator">{pageId}</Text>;
    },
}));

const snapshot: LocalTranslationReaderSnapshot = {
    project: {
        id: 'project-1',
        sourceLanguage: 'ja',
        targetLanguage: 'pt-BR',
        status: 'READY',
        createdAt: 10,
        updatedAt: 20,
        statusUpdatedAt: 20,
        languageReviewRequired: false,
        pages: [0, 1].map(position => ({
            id: `page-${position}`,
            projectId: 'project-1',
            position,
            originalFilename: `original-${position}.jpg`,
            originalByteSize: 25,
            originalMimeType: 'image/jpeg' as const,
            widthPx: 800,
            heightPx: 1200,
            mediaValidatedAt: 10,
            mediaValidationPolicyVersion: 1,
            status: 'READY' as const,
            createdAt: 10,
            updatedAt: 20,
            statusUpdatedAt: 20,
        })),
    },
    initialPosition: 0,
    results: new Map(
        [0, 1].map(position => [
            `page-${position}`,
            {
                pageId: `page-${position}`,
                attemptId: null,
                sourceKind: 'DEMO' as const,
                renderedFilename: `demo-${position}.jpg`,
                mimeType: 'image/jpeg' as const,
                byteSize: 25,
                widthPx: 800,
                heightPx: 1200,
                sha256: 'a'.repeat(64),
                readyAt: 20,
                autoOpenedAt: null,
                regions: [
                    {
                        id: `region-${position}`,
                        pageId: `page-${position}`,
                        readingOrder: 0,
                        sourceText: 'Source must stay hidden',
                        translatedText: 'Tradução simulada',
                        translationMetadata: null,
                        overflow: false,
                        createdAt: 20,
                        vertices: [
                            { index: 0, x: 0.1, y: 0.1 },
                            { index: 1, x: 0.9, y: 0.1 },
                            { index: 2, x: 0.9, y: 0.2 },
                            { index: 3, x: 0.1, y: 0.2 },
                        ],
                    },
                ],
            },
        ]),
    ),
};

describe('MOB-FEAT-051/AC-003/005 local reader page integration', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it('adapts the offline snapshot, validates only visible pages and debounces progress', async () => {
        const open: OpenLocalTranslationResultController = {
            load: jest.fn().mockResolvedValue(snapshot),
            validate: jest.fn().mockResolvedValue(true),
            validateOriginal: jest.fn().mockResolvedValue(true),
            resultUri: jest.fn((_, result) => `file:///${result.renderedFilename}`),
            originalUri: jest.fn((_, position) => `file:///original-${position}.jpg`),
        };
        const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
        const rendered = render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <ThemeProvider waitForPlatform={false}>
                    <LocalTranslationReaderPage projectId="project-1" openController={open} progressController={progress} />
                </ThemeProvider>
            </SafeAreaProvider>,
        );

        expect(await screen.findAllByText('Tradução simulada')).toHaveLength(2);
        expect(screen.queryByText('Source must stay hidden')).toBeNull();
        fireEvent(screen.getByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
        expect(screen.getByRole('button', { name: 'Ajustes do leitor' })).toBeOnTheScreen();
        const list = screen.getByTestId('reader-vertical');
        await act(async () => {
            list.props.onViewableItemsChanged({ viewableItems: [{ item: list.props.data[1], index: 1, isViewable: true }] });
            fireEvent.scroll(list, {
                nativeEvent: {
                    contentOffset: { x: 0, y: 800 },
                    contentSize: { width: 750, height: 2250 },
                    layoutMeasurement: { width: 750, height: 1334 },
                    velocity: { x: 0, y: 0 },
                    zoomScale: 1,
                },
            });
        });
        await waitFor(() => expect(open.validate).toHaveBeenCalledWith('project-1', snapshot.results.get('page-1')));
        await waitFor(() => expect(progress.save).toHaveBeenCalledWith('project-1', 1), { timeout: 800 });
        rendered.unmount();
    });
});

it('keeps the original visible when a page has no translated result', async () => {
    const results = new Map(snapshot.results);
    results.delete('page-1');
    const open: OpenLocalTranslationResultController = {
        load: jest.fn(async () => ({ ...snapshot, results })),
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: () => 'file:///translated.webp',
        originalUri: (_, position) => `file:///original-${position}.jpg`,
    };
    const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn(async () => undefined) };
    const rendered = render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationReaderPage projectId="project-1" openController={open} progressController={progress} />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    const list = await screen.findByTestId('reader-vertical');
    expect(list.props.data[1].primaryUri).toBe('file:///original-1.jpg');
    await act(async () => {
        list.props.onViewableItemsChanged({ viewableItems: [{ item: list.props.data[1], index: 1, isViewable: true }] });
    });
    await waitFor(() => expect(open.validateOriginal).toHaveBeenCalledWith(snapshot.project, 1));
    expect(screen.queryByTestId('reader-page-error-page-1')).toBeNull();
    rendered.unmount();
});

it('reads REMOTE without demo overlay, keeps original comparison and exposes full overflow offline', async () => {
    const results = new Map(
        [...snapshot.results].map(([id, result]) => [
            id,
            {
                ...result,
                sourceKind: 'REMOTE' as const,
                attemptId: 'attempt',
                regions: result.regions.map(r => ({ ...r, translatedText: 'Texto remoto completo.', overflow: true })),
            },
        ]),
    );
    const open: OpenLocalTranslationResultController = {
        load: jest.fn(async () => ({ ...snapshot, results })),
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: () => 'file:///remote.webp',
        originalUri: () => 'file:///original.png',
    };
    const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn(async () => undefined) };
    const rendered = render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationReaderPage projectId="project-1" openController={open} progressController={progress} />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    await waitFor(() => expect(open.load).toHaveBeenCalled());
    expect(screen.queryByText('Tradução simulada')).toBeNull();
    fireEvent(await screen.findByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    // MOB-FEAT-063 (D2): folha única sem abas; a comparação virou o alternador da barra inferior.
    expect(screen.getByRole('radio', { name: 'Original' })).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Ajustes do leitor' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Ver texto completo' }));
    expect(await screen.findByText('Texto remoto completo.')).toBeOnTheScreen();
    rendered.unmount();
});

it.each([
    ['pt-BR', 'Nenhum texto foi identificado nesta página.'],
    ['en-US', 'No text was identified on this page.'],
    ['es-ES', 'No se identificó texto en esta página.'],
])('opens an art-only REMOTE page with localized notice and no empty fallback in %s', async (locale, notice) => {
    await i18n.changeLanguage(locale);
    const results = new Map([...snapshot.results].map(([id, result]) => [id, { ...result, sourceKind: 'REMOTE' as const, attemptId: 'attempt', regions: [] }]));
    const open: OpenLocalTranslationResultController = {
        load: jest.fn(async () => ({ ...snapshot, results })),
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: () => 'file:///art.webp',
        originalUri: () => 'file:///original.png',
    };
    const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn(async () => undefined) };
    const rendered = render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationReaderPage projectId="project-1" openController={open} progressController={progress} />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    expect(await screen.findByText(notice)).toBeOnTheScreen();
    expect(screen.queryByText(i18n.t('reader:actions.overflow'))).toBeNull();
    expect(screen.queryByText('Tradução simulada')).toBeNull();
    rendered.unmount();
    await i18n.changeLanguage('pt-BR');
});

it('shows the retry marker only while the visible page has no translated result', async () => {
    const results = new Map(snapshot.results);
    results.delete('page-1');
    const open: OpenLocalTranslationResultController = {
        load: jest.fn(async () => ({ ...snapshot, results, initialPosition: 1 })),
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: () => 'file:///translated.webp',
        originalUri: (_, position) => `file:///original-${position}.jpg`,
    };
    const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn(async () => undefined) };
    const rendered = render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationReaderPage projectId="project-1" openController={open} progressController={progress} />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    expect(await screen.findByTestId('page-retry-indicator')).toHaveTextContent('page-1');
    rendered.unmount();
});
