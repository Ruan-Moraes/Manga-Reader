import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { normalizeReaderSettings, ReaderGestureControls, ReaderSettingsControls } from '@/features/configure-chapter-reader';
import {
    type LocalTranslationReaderSnapshot,
    type OpenLocalTranslationResultController,
    openLocalTranslationResultController,
    type TrackLocalReadingProgressController,
    trackLocalReadingProgressController,
} from '@/features/local-translation';
import { useSettingsStore } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { Button, EmptyState, PageContainer, StatusMessage, Toast } from '@/shared/ui';
import { ContentReader, type ImageSequenceDocument, type ReaderLocation } from '@/widgets/content-reader';

/** How often a partially translated project looks for newly saved pages. */
const PARTIAL_REFRESH_MS = 4000;

interface Props {
    projectId: string;
    openController?: OpenLocalTranslationResultController;
    progressController?: TrackLocalReadingProgressController;
}

export function LocalTranslationReaderPage({
    projectId,
    openController = openLocalTranslationResultController,
    progressController = trackLocalReadingProgressController,
}: Props) {
    const { t } = useTranslation('localTranslation');
    const settings = useSettingsStore(state => state.settings);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const readerGestures = useSettingsStore(state => state.readerGestures);
    const updateReaderGestures = useSettingsStore(state => state.updateReaderGestures);
    const localError = useSettingsStore(state => state.localError);
    const retryReaderGesturesPersistence = useSettingsStore(state => state.retryReaderGesturesPersistence);
    const [snapshot, setSnapshot] = useState<LocalTranslationReaderSnapshot | null | undefined>(undefined);
    const [location, setLocation] = useState<ReaderLocation>({ itemId: '', index: 0 });
    const locationRef = useRef(location);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exit = () => navigateBackOrReplace(ROUTES.TRANSLATION_LIBRARY);

    useEffect(() => {
        let active = true;
        void openController
            .load(projectId)
            .then(result => {
                if (!active) return;
                setSnapshot(result);
                const page = result?.project.pages.find(candidate => candidate.position === result.initialPosition) ?? result?.project.pages[0];
                setLocation({ itemId: page?.id ?? '', index: page?.position ?? 0 });
            })
            .catch(() => active && setSnapshot(null));
        return () => {
            active = false;
        };
    }, [openController, projectId]);

    // A project still being translated (MOB-FEAT-022) opens with its ready pages; the others show their original and
    // switch to the translation as soon as it is saved. Only the results are refreshed: the reading position stays.
    const translating = snapshot ? snapshot.project.pages.some(page => !snapshot.results.has(page.id)) : false;
    useEffect(() => {
        if (!translating) return undefined;
        let active = true;
        const timer = setInterval(() => {
            void openController
                .load(projectId)
                .then(result => {
                    if (active && result)
                        setSnapshot(current =>
                            current && result.results.size !== current.results.size
                                ? { ...current, project: result.project, results: result.results }
                                : current,
                        );
                })
                .catch(() => undefined);
        }, PARTIAL_REFRESH_MS);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [openController, projectId, translating]);

    const flush = useCallback(() => {
        if (!snapshot) return;
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            saveTimer.current = null;
        }
        void progressController.save(snapshot.project.id, locationRef.current.index);
    }, [progressController, snapshot]);

    useEffect(() => {
        locationRef.current = location;

        if (!snapshot) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);

        saveTimer.current = setTimeout(flush, 350);

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [flush, location, snapshot]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', state => {
            if (state !== 'active') flush();
        });
        return () => {
            subscription.remove();
            flush();
        };
    }, [flush]);

    const document = useMemo<ImageSequenceDocument | null>(() => {
        if (!snapshot) return null;

        const sourceKinds = snapshot.project.pages
            .map(page => snapshot.results.get(page.id)?.sourceKind)
            .filter((value): value is 'DEMO' | 'REMOTE' => !!value);

        const sourceKind = sourceKinds.length > 0 && sourceKinds.every(kind => kind === 'DEMO') ? 'DEMO' : 'REMOTE';

        return {
            kind: 'IMAGE_SEQUENCE',
            id: snapshot.project.id,
            title: t('reader.title'),
            sourceKind,
            initialLocation: {
                itemId: snapshot.project.pages.find(page => page.position === snapshot.initialPosition)?.id ?? snapshot.project.pages[0]?.id ?? '',
                index: snapshot.initialPosition,
            },
            items: snapshot.project.pages.map(page => {
                const result = snapshot.results.get(page.id);

                const originalUri = openController.originalUri(snapshot.project, page.position);

                return {
                    id: page.id,
                    primaryUri: result ? openController.resultUri(snapshot.project.id, result) : (originalUri ?? ''),
                    pending: !result,
                    originalUri,
                    width: result?.widthPx ?? page.widthPx,
                    height: result?.heightPx ?? page.heightPx,
                    demoOverlays:
                        result?.sourceKind === 'DEMO'
                            ? result.regions.map(region => ({
                                  id: region.id,
                                  translatedText: region.translatedText,
                                  overflow: region.overflow,
                                  vertices: region.vertices,
                              }))
                            : undefined,
                };
            }),
        };
    }, [openController, snapshot, t]);

    const validateItem = useCallback(
        async (itemId: string) => {
            if (!snapshot) return false;

            const result = snapshot.results.get(itemId);

            // A page not translated yet shows its original, validated when it was imported: nothing to check here.
            return result ? openController.validate(snapshot.project.id, result) : true;
        },
        [openController, snapshot],
    );

    if (snapshot === undefined) {
        return (
            <PageContainer>
                <StatusMessage title={t('reader.loading')} tone="loading" />
            </PageContainer>
        );
    }

    if (!snapshot || !document?.items.length) {
        return (
            <PageContainer>
                <EmptyState
                    title={t('reader.unavailableTitle')}
                    description={t('reader.unavailableDescription')}
                    action={<Button onPress={exit}>{t('reader.library')}</Button>}
                />
            </PageContainer>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ContentReader
                document={document}
                location={location}
                settings={settings.reader}
                gesturePreferences={readerGestures}
                onExit={exit}
                onLocationChange={setLocation}
                onValidateItem={validateItem}
                controlSections={[
                    {
                        id: 'reading',
                        title: t('reader:panel.tabs.reading'),
                        content: (
                            <ReaderSettingsControls
                                compact
                                category="reading"
                                value={settings.reader}
                                capabilities={{ low: false, medium: false, high: false }}
                                onChange={patch => void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader')}
                            />
                        ),
                    },
                    {
                        id: 'appearance',
                        title: t('reader:panel.tabs.appearance'),
                        content: (
                            <ReaderSettingsControls
                                compact
                                category="appearance"
                                value={settings.reader}
                                capabilities={{ low: false, medium: false, high: false }}
                                onChange={patch => void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader')}
                            />
                        ),
                    },
                    {
                        id: 'gestures',
                        title: t('reader:panel.tabs.gestures'),
                        content: (
                            <ReaderGestureControls
                                compact
                                value={readerGestures}
                                onChange={patch => void updateReaderGestures(patch)}
                                sideNavigationAvailable={settings.reader.mode !== 'VERTICAL' && settings.reader.direction !== 'WEBTOON'}
                                persistenceError={!!localError}
                                onRetry={() => void retryReaderGesturesPersistence()}
                            />
                        ),
                    },
                ]}
            />
            <TranslationProgressToast ready={snapshot.results.size} total={snapshot.project.pages.length} />
        </View>
    );
}

/**
 * While a project is still being translated, the app's toast says so with the count of ready pages; it may be
 * dismissed, and when the last page arrives it turns into "translation ready" and leaves by itself (MOB-FEAT-024).
 */
function TranslationProgressToast({ ready, total }: { ready: number; total: number }) {
    const { t } = useTranslation('reader');
    const [dismissed, setDismissed] = useState(false);
    const [done, setDone] = useState<'hidden' | 'shown' | 'gone'>('hidden');
    const wasPartial = useRef(false);
    if (ready < total) wasPartial.current = true;
    useEffect(() => {
        if (ready >= total && wasPartial.current && done === 'hidden') setDone('shown');
    }, [done, ready, total]);

    if (ready < total && !dismissed) {
        return (
            <Toast
                testID="translation-progress-toast"
                icon="progress"
                title={t('translationProgress.title')}
                description={t('translationProgress.description', { ready, total })}
                duration={0}
                onDismiss={() => setDismissed(true)}
            />
        );
    }
    if (done !== 'shown') return null;
    return (
        <Toast
            testID="translation-done-toast"
            tone="success"
            title={t('translationProgress.doneTitle')}
            description={t('translationProgress.doneDescription', { total })}
            onDismiss={() => setDone('gone')}
        />
    );
}
