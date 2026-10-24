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
import { Button, EmptyState, PageContainer, StatusMessage } from '@/shared/ui';
import { ContentReader, type ImageSequenceDocument, type ReaderLocation } from '@/widgets/content-reader';

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

            return result ? openController.validate(snapshot.project.id, result) : false;
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
        </View>
    );
}
