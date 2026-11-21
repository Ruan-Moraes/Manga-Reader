import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalTranslationReaderSnapshot, OpenLocalTranslationResultController, TrackLocalReadingProgressController } from '@/features/local-translation';
import { useDeveloperMode } from '@/shared/config';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';
import { useToastStore } from '@/shared/ui';

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
    beforeEach(() => {
        useDeveloperMode.setState({ enabled: true, hydrated: true });
        return i18n.changeLanguage('pt-BR');
    });
    afterEach(() => useDeveloperMode.setState({ enabled: false }));

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

it('shows originals for missing results and saved demos while developer mode is off', async () => {
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
    expect(list.props.data.map((item: { primaryUri: string }) => item.primaryUri)).toEqual(['file:///original-0.jpg', 'file:///original-1.jpg']);
    expect(screen.queryByText('Tradução simulada')).toBeNull();
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
    // Revisão 2026-11-13: o aviso fica no painel inferior e aparece com os controles; a leitura imersiva usa a tela toda.
    const bottomBar = within(await screen.findByTestId('reader-bottom-bar', { includeHiddenElements: true }));
    expect(bottomBar.getByText(notice, { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText(i18n.t('reader:actions.overflow'))).toBeNull();
    expect(screen.queryByText('Tradução simulada')).toBeNull();
    rendered.unmount();
    await i18n.changeLanguage('pt-BR');
});

it('capítulo sem obra usa o nome da biblioteca no título em vez de "Leitor local" (revisão 2026-11-13)', async () => {
    const open: OpenLocalTranslationResultController = {
        load: jest.fn(async () => snapshot),
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: () => 'file:///result.webp',
        originalUri: () => 'file:///original.png',
    };
    const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn(async () => undefined) };
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationReaderPage
                    projectId="project-1"
                    openController={open}
                    progressController={progress}
                    loadOverview={async () => ({ works: [], unassigned: [] }) as never}
                />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    const date = new Intl.DateTimeFormat('pt-BR').format(snapshot.project.createdAt);
    expect(await screen.findByText(`Capítulo de ${date}`, { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('Sem obra', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('Leitor local', { includeHiddenElements: true })).toBeNull();
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

it('enquanto abre, mostra o carregamento do leitor com saída visível em vez do cartão de status', async () => {
    await i18n.changeLanguage('pt-BR');
    const open: OpenLocalTranslationResultController = {
        load: jest.fn(() => new Promise<never>(() => undefined)),
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: () => 'file:///result.webp',
        originalUri: () => 'file:///original.png',
    };
    const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn(async () => undefined) };
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationReaderPage
                    projectId="project-1"
                    openController={open}
                    progressController={progress}
                    loadOverview={async () => ({ works: [], unassigned: [] }) as never}
                />
            </ThemeProvider>
        </SafeAreaProvider>,
    );

    const loading = screen.getByTestId('local-reader-loading');
    expect(loading.props.role).toBe('status');
    expect(loading.props.accessibilityLabel).toBe('Abrindo o capítulo…');
    expect(screen.getByTestId('local-reader-loading-dots')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sair do leitor' })).toBeOnTheScreen();
    await act(async () => undefined);
});

describe('MOB-FEAT-024/AC-001 the app toast says a project is still being translated', () => {
    const partialOpen = (load: jest.Mock): OpenLocalTranslationResultController => ({
        load,
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: (_, result) => `file:///${result.renderedFilename}`,
        originalUri: (_, position) => `file:///original-${position}.jpg`,
    });
    // Translations from the gateway: demo results stay hidden while developer mode is off.
    const remote = (results: LocalTranslationReaderSnapshot['results']) =>
        new Map([...results].map(([id, result]) => [id, { ...result, sourceKind: 'REMOTE' as const, attemptId: 'attempt' }]));
    const complete = (): LocalTranslationReaderSnapshot => ({ ...snapshot, results: remote(snapshot.results) });
    const partial = (): LocalTranslationReaderSnapshot => ({
        ...snapshot,
        project: { ...snapshot.project, status: 'PROCESSING' },
        results: remote(new Map([['page-0', snapshot.results.get('page-0')!]])),
    });
    const mount = (open: OpenLocalTranslationResultController) =>
        render(
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
                <ThemeProvider waitForPlatform={false}>
                    <LocalTranslationReaderPage
                        projectId="project-1"
                        openController={open}
                        progressController={{ load: jest.fn(), save: jest.fn(async () => undefined) }}
                    />
                </ThemeProvider>
            </SafeAreaProvider>,
        );

    beforeEach(() => useToastStore.getState().dismiss());

    it.each([
        ['pt-BR', 'Traduzindo…', '1 de 2 páginas prontas'],
        ['en-US', 'Translating…', '1 of 2 pages ready'],
        ['es-ES', 'Traduciendo…', '1 de 2 páginas listas'],
    ])('opens a partial project with the progress toast in %s', async (locale, title, description) => {
        await i18n.changeLanguage(locale);
        const rendered = mount(partialOpen(jest.fn().mockResolvedValue(partial())));
        await waitFor(() => expect(useToastStore.getState().current).toMatchObject({ tone: 'info', title, description }));
        rendered.unmount();
        await i18n.changeLanguage('pt-BR');
    });

    it('says the translation is ready when the last page arrives, and nothing for a project opened complete', async () => {
        const rendered = mount(partialOpen(jest.fn().mockResolvedValueOnce(partial()).mockResolvedValue(complete())));
        await waitFor(() => expect(useToastStore.getState().current?.description).toBe('1 de 2 páginas prontas'));
        await waitFor(() => expect(useToastStore.getState().current).toMatchObject({ tone: 'success', title: 'Tradução pronta' }), { timeout: 7000 });
        rendered.unmount();

        useToastStore.getState().dismiss();
        const opened = mount(partialOpen(jest.fn().mockResolvedValue(complete())));
        await screen.findByTestId('reader-vertical');
        expect(useToastStore.getState().current).toBeNull();
        opened.unmount();
    }, 15000);
});
