import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { TranslationState } from '@/entities/translation-page';
import type { LocalTranslationReaderSnapshot, OpenLocalTranslationResultController, TrackLocalReadingProgressController } from '@/features/local-translation';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';
import type { ContentReaderProps } from '@/widgets/content-reader';
import type { LibraryOverview } from '@/widgets/local-translation-library';

import { LocalTranslationReaderPage } from '../LocalTranslationReaderPage';

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockReaderProps: ContentReaderProps | null = null;
jest.mock('expo-router', () => ({
    router: { back: jest.fn(), canGoBack: () => true, push: (...args: unknown[]) => mockPush(...args), replace: (...args: unknown[]) => mockReplace(...args) },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/widgets/content-reader', () => ({
    ContentReader: (props: ContentReaderProps) => {
        mockReaderProps = props;
        return null;
    },
}));
jest.mock('@/widgets/remote-processing', () => {
    const { Text } = jest.requireActual('react-native');
    return {
        PageRetryIndicator: () => null,
        BatchRetrySheet: ({ visible, projectId, description }: { visible: boolean; projectId: string; description?: string }) =>
            visible ? <Text>{`batch:${projectId} ${description ?? ''}`}</Text> : null,
    };
});

function snapshot(statuses: TranslationState[], withResults: boolean): LocalTranslationReaderSnapshot {
    const pages = statuses.map((status, position) => ({
        id: `page-${position}`,
        projectId: 'chapter-2',
        position,
        originalFilename: `original-${position}.jpg`,
        originalByteSize: 25,
        originalMimeType: 'image/jpeg' as const,
        widthPx: 800,
        heightPx: 1200,
        mediaValidatedAt: 10,
        mediaValidationPolicyVersion: 1,
        status,
        createdAt: 10,
        updatedAt: 20,
        statusUpdatedAt: 20,
    }));
    return {
        project: {
            id: 'chapter-2',
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            status: 'READY',
            createdAt: 10,
            updatedAt: 20,
            statusUpdatedAt: 20,
            languageReviewRequired: false,
            pages,
        },
        initialPosition: 0,
        results: new Map(
            withResults
                ? pages.map(page => [
                      page.id,
                      {
                          pageId: page.id,
                          attemptId: 'attempt',
                          sourceKind: 'REMOTE' as const,
                          renderedFilename: `${page.id}.webp`,
                          mimeType: 'image/webp' as const,
                          byteSize: 25,
                          widthPx: 800,
                          heightPx: 1200,
                          sha256: 'a'.repeat(64),
                          readyAt: 20,
                          autoOpenedAt: null,
                          regions: [
                              { id: 'r', readingOrder: 0, sourceText: 's', translatedText: 't', overflow: false, vertices: [], translationMetadata: null },
                          ],
                      },
                  ])
                : [],
        ) as unknown as LocalTranslationReaderSnapshot['results'],
    };
}

const chapter = (projectId: string, label: string) => ({
    projectId,
    label,
    link: { projectId, workId: 'w1', label, createdAt: 1, updatedAt: 1 },
    createdAt: 1,
    pages: 2,
    readyPages: 2,
    failedPages: 0,
    state: 'saved' as const,
    currentPage: null,
    progressUpdatedAt: null,
    coverUri: 'file:///c.jpg',
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    demo: false,
});

const overview: LibraryOverview = {
    works: [
        {
            work: { id: 'w1', name: 'Beta', coverFilename: null, createdAt: 1, updatedAt: 1 },
            chapters: [chapter('chapter-1', 'Prólogo'), chapter('chapter-2', 'Dois'), chapter('chapter-3', 'Três')],
            pages: 6,
            failedChapters: 0,
            processingChapters: 0,
            languages: ['ja→pt-BR'],
            lastRead: null,
        },
    ],
    unassigned: [],
    continueReading: null,
};

function page(value: LocalTranslationReaderSnapshot, loadOverview: () => Promise<LibraryOverview> = async () => overview) {
    const open: OpenLocalTranslationResultController = {
        load: jest.fn(async () => value),
        validate: jest.fn(async () => true),
        validateOriginal: jest.fn(async () => true),
        resultUri: () => 'file:///result.webp',
        originalUri: () => 'file:///original.jpg',
    };
    const progress: TrackLocalReadingProgressController = { load: jest.fn(), save: jest.fn(async () => undefined) };
    return render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LocalTranslationReaderPage projectId="chapter-2" openController={open} progressController={progress} loadOverview={loadOverview} />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
}

describe('MOB-FEAT-063 leitor local no padrão do kit', () => {
    beforeEach(async () => {
        mockReaderProps = null;
        mockReplace.mockClear();
        mockPush.mockClear();
        await i18n.changeLanguage('pt-BR');
    });

    it('AC-001/AC-002/AC-004 leitor de obra recebe capítulo, obra, capítulos, vizinhos e fim do capítulo', async () => {
        page(snapshot(['READY', 'READY'], true));
        await waitFor(() => expect(mockReaderProps?.chapters?.items).toHaveLength(3));
        const props = mockReaderProps!;
        expect(props.document.title).toBe('Dois');
        expect(props.subtitle).toBe('Beta');
        expect(props.comparison).toBe(true);
        expect(props.blockingState).toBeUndefined();
        expect(props.chapters).toMatchObject({ currentId: 'chapter-2' });
        props.chapters!.onSelect('chapter-3');
        expect(mockReplace).toHaveBeenCalledWith({ pathname: '/translation-reader/[projectId]', params: { projectId: 'chapter-3' } });
        expect(props.endOfChapter).toMatchObject({ workTitle: 'Beta', backTarget: 'work' });
        props.endOfChapter!.onBack();
        expect(mockReplace).toHaveBeenCalledWith({ pathname: '/work/[workId]', params: { workId: 'w1' } });
        props.settingsSheet!.onOpenAllSettings();
        expect(mockPush).toHaveBeenCalledWith('/settings/reader');
    });

    it('AC-001 capítulo sem obra não recebe lista nem vizinhos e o fim só volta', async () => {
        page(snapshot(['READY'], true), async () => ({ ...overview, works: [] }));
        await waitFor(() => expect(mockReaderProps).not.toBeNull());
        await act(async () => undefined);
        expect(mockReaderProps!.chapters).toBeUndefined();
        expect(mockReaderProps!.endOfChapter).toMatchObject({ backTarget: 'back' });
    });

    it('AC-005 capítulo em tradução sem resultado mostra "Tradução em andamento" com "Ler original"', async () => {
        page(snapshot(['PROCESSING', 'QUEUED'], false));
        await waitFor(() => expect(mockReaderProps?.blockingState).toBeDefined());
        expect(mockReaderProps!.comparison).toBe(false);
        const readOriginal = jest.fn();
        const { getByText, queryByText } = render(<ThemeProvider waitForPlatform={false}>{mockReaderProps!.blockingState!({ readOriginal })}</ThemeProvider>);
        expect(getByText('Tradução em andamento')).toBeOnTheScreen();
        expect(queryByText('Tentar de novo')).toBeNull();
        fireEvent.press(getByText('Ler original'));
        expect(readOriginal).toHaveBeenCalled();
    });

    it('AC-005 capítulo que falhou oferece "Tentar de novo" pelo painel de lote da 055', async () => {
        const view = page(snapshot(['FAILED', 'FAILED'], false));
        await waitFor(() => expect(mockReaderProps?.blockingState).toBeDefined());
        const blocking = render(<ThemeProvider waitForPlatform={false}>{mockReaderProps!.blockingState!({ readOriginal: jest.fn() })}</ThemeProvider>);
        expect(blocking.getByText('Não foi possível traduzir')).toBeOnTheScreen();
        fireEvent.press(blocking.getByText('Tentar de novo'));
        blocking.unmount();
        // `toBeOnTheScreen` checks the latest render; the page tree is queried through its own handle.
        expect(await view.findByText('batch:chapter-2 Só as páginas que falharam são enviadas, e só depois do seu aceite.')).toBeTruthy();
    });
});
