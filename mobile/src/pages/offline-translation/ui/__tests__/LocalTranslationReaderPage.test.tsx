import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalTranslationReaderSnapshot, OpenLocalTranslationResultController, TrackLocalReadingProgressController } from '@/features/local-translation';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { LocalTranslationReaderPage } from '../LocalTranslationReaderPage';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() } }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

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
        expect(screen.getByRole('button', { name: 'Configurações do leitor' })).toBeOnTheScreen();
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
