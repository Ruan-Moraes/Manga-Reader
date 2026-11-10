import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { normalizeReaderSettings, ReaderSettingsControls } from '@/features/configure-chapter-reader';
import {
    type LocalTranslationReaderSnapshot,
    type OpenLocalTranslationResultController,
    openLocalTranslationResultController,
    type TrackLocalReadingProgressController,
    trackLocalReadingProgressController,
} from '@/features/local-translation';
import { useSettingsStore } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, EmptyState, Icon, PageContainer, StatusMessage } from '@/shared/ui';
import { ContentReader, type ImageSequenceDocument, type ReaderLocation } from '@/widgets/content-reader';
import { type LibraryOverview, loadLibraryOverview } from '@/widgets/local-translation-library';
import { BatchRetrySheet, PageRetryIndicator } from '@/widgets/remote-processing';

interface Props {
    projectId: string;
    openController?: OpenLocalTranslationResultController;
    progressController?: TrackLocalReadingProgressController;
    /** Loads works and chapters so the reader knows the chapter's work (063); failures just hide the work controls. */
    loadOverview?: () => Promise<LibraryOverview>;
}

function BlockingState({ state, pages, onRetry, onReadOriginal }: { state: 'processing' | 'failed'; pages: number; onRetry(): void; onReadOriginal(): void }) {
    const { t } = useTranslation('reader');
    const { spacing, tokens } = useTheme();
    return (
        <View accessible={false} style={{ alignItems: 'center', gap: spacing.sm }}>
            <Icon
                name={state === 'processing' ? 'sync-outline' : 'alert-circle-outline'}
                size={40}
                color={state === 'processing' ? tokens.accentText : tokens.danger}
            />
            <AppText accessibilityRole="header" variant="section" style={{ textAlign: 'center' }}>
                {t(state === 'processing' ? 'kit.processingTitle' : 'kit.failedTitle')}
            </AppText>
            <AppText tone="muted" style={{ textAlign: 'center' }}>
                {state === 'processing' ? t('kit.processingText', { count: pages }) : t('kit.failedText')}
            </AppText>
            <View style={{ gap: spacing.sm, marginTop: spacing.md, maxWidth: 320, width: '100%' }}>
                {state === 'failed' ? (
                    <Button fullWidth onPress={onRetry}>
                        {t('kit.retry')}
                    </Button>
                ) : null}
                <Button fullWidth variant="outline" onPress={onReadOriginal}>
                    {t('kit.readOriginal')}
                </Button>
            </View>
        </View>
    );
}

export function LocalTranslationReaderPage({
    projectId,
    openController = openLocalTranslationResultController,
    progressController = trackLocalReadingProgressController,
    loadOverview = loadLibraryOverview,
}: Props) {
    const { t } = useTranslation('localTranslation');
    const { t: reader } = useTranslation('reader');
    // Rótulo só numérico (055) vira "Capítulo N", como o título do kit; nomes livres ficam como estão.
    const chapterName = (label: string) => (/^\d+(?:[.,]\d+)?$/.test(label.trim()) ? reader('viewport.chapter', { chapter: label.trim() }) : label);
    const { minimumTouchTarget, spacing } = useTheme();
    const insets = useSafeAreaInsets();
    const settings = useSettingsStore(state => state.settings);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const readerGestures = useSettingsStore(state => state.readerGestures);
    const [overflowOpen, setOverflowOpen] = useState(false);
    const [snapshot, setSnapshot] = useState<LocalTranslationReaderSnapshot | null | undefined>(undefined);
    const [location, setLocation] = useState<ReaderLocation>({ itemId: '', index: 0 });
    const locationRef = useRef(location);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [overview, setOverview] = useState<LibraryOverview | null>(null);
    const [retryOpen, setRetryOpen] = useState(false);
    const exit = () => navigateBackOrReplace(ROUTES.TRANSLATION_LIBRARY);
    const reloadSnapshot = useCallback(() => setReloadToken(value => value + 1), []);

    useEffect(() => {
        let active = true;
        void loadOverview()
            .then(value => active && setOverview(value))
            .catch(() => active && setOverview(null));
        return () => {
            active = false;
        };
    }, [loadOverview, projectId, reloadToken]);

    const workEntry = overview?.works.find(entry => entry.chapters.some(chapter => chapter.projectId === projectId)) ?? null;
    const workChapter = workEntry?.chapters.find(chapter => chapter.projectId === projectId) ?? null;
    const openChapter = (id: string) => router.replace({ pathname: ROUTES.TRANSLATION_READER, params: { projectId: id } } as never);

    useEffect(() => {
        let active = true;
        void openController
            .load(projectId)
            .then(result => {
                if (!active) return;
                setSnapshot(result);
                // Recarregar após um retry mantém a página atual; só a abertura inicial usa o progresso salvo.
                if (reloadToken > 0) return;
                const page = result?.project.pages.find(candidate => candidate.position === result.initialPosition) ?? result?.project.pages[0];
                setLocation({ itemId: page?.id ?? '', index: page?.position ?? 0 });
            })
            .catch(() => active && setSnapshot(null));
        return () => {
            active = false;
        };
    }, [openController, projectId, reloadToken]);

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

    const documentTitle = workChapter?.label ? chapterName(workChapter.label) : t('reader.title');
    const document = useMemo<ImageSequenceDocument | null>(() => {
        if (!snapshot) return null;

        const sourceKinds = snapshot.project.pages
            .map(page => snapshot.results.get(page.id)?.sourceKind)
            .filter((value): value is 'DEMO' | 'REMOTE' => !!value);

        const sourceKind = sourceKinds.length > 0 && sourceKinds.every(kind => kind === 'DEMO') ? 'DEMO' : 'REMOTE';

        return {
            kind: 'IMAGE_SEQUENCE',
            id: snapshot.project.id,
            title: documentTitle,
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
    }, [documentTitle, openController, snapshot]);

    const validateItem = useCallback(
        async (itemId: string) => {
            if (!snapshot) return false;

            const result = snapshot.results.get(itemId);

            if (result) return openController.validate(snapshot.project.id, result);

            const page = snapshot.project.pages.find(candidate => candidate.id === itemId);
            return page ? openController.validateOriginal(snapshot.project, page.position) : false;
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

    const statuses = snapshot.project.pages.map(page => page.status);
    const blockedState: 'processing' | 'failed' | null =
        snapshot.results.size > 0
            ? null
            : statuses.some(status => status === 'QUEUED' || status === 'PROCESSING')
              ? 'processing'
              : statuses.includes('FAILED')
                ? 'failed'
                : null;

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
                controlsContent={
                    snapshot.results.get(location.itemId)?.sourceKind === 'REMOTE' &&
                    snapshot.results.get(location.itemId)?.regions.some(region => region.overflow) ? (
                        <View>
                            <Button variant="outline" onPress={() => setOverflowOpen(value => !value)}>
                                {t('reader:actions.overflow')}
                            </Button>
                            {overflowOpen
                                ? snapshot.results
                                      .get(location.itemId)
                                      ?.regions.filter(region => region.overflow)
                                      .map(region => <AppText key={region.id}>{region.translatedText}</AppText>)
                                : null}
                        </View>
                    ) : undefined
                }
                subtitle={workEntry?.work.name}
                comparison={snapshot.results.size > 0}
                chapters={
                    workEntry
                        ? {
                              items: workEntry.chapters.map(chapter => ({ id: chapter.projectId, title: chapter.label ? chapterName(chapter.label) : '' })),
                              currentId: projectId,
                              onSelect: openChapter,
                          }
                        : undefined
                }
                endOfChapter={
                    workEntry
                        ? {
                              workTitle: workEntry.work.name,
                              backTarget: 'work',
                              onBack: () => router.replace({ pathname: ROUTES.WORK, params: { workId: workEntry.work.id } } as never),
                          }
                        : { backTarget: 'back', onBack: exit }
                }
                blockingState={
                    blockedState
                        ? ({ readOriginal }) => (
                              <BlockingState
                                  state={blockedState}
                                  pages={snapshot.project.pages.length}
                                  onRetry={() => setRetryOpen(true)}
                                  onReadOriginal={readOriginal}
                              />
                          )
                        : undefined
                }
                settingsSheet={{
                    content: (
                        <ReaderSettingsControls
                            compact
                            category="quick"
                            value={settings.reader}
                            capabilities={{ low: false, medium: false, high: false }}
                            onChange={patch => void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader')}
                        />
                    ),
                    onOpenAllSettings: () => router.push(ROUTES.SETTINGS.READER as never),
                }}
            />
            {location.itemId && !snapshot.results.has(location.itemId) ? (
                <View pointerEvents="box-none" style={{ position: 'absolute', right: insets.right, top: insets.top + minimumTouchTarget + spacing.xl }}>
                    <PageRetryIndicator key={location.itemId} projectId={snapshot.project.id} pageId={location.itemId} onTranslated={reloadSnapshot} />
                </View>
            ) : null}
            <BatchRetrySheet
                visible={retryOpen}
                onClose={() => {
                    setRetryOpen(false);
                    reloadSnapshot();
                }}
                closeLabel={reader('kit.close')}
                title={reader('kit.retryTitle')}
                description={reader('kit.retryDescription')}
                projectId={snapshot.project.id}
            />
            {snapshot.results.get(location.itemId)?.sourceKind === 'REMOTE' && snapshot.results.get(location.itemId)?.regions.length === 0 ? (
                <View style={{ padding: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.md) }}>
                    <StatusMessage title={t('reader.noText')} />
                </View>
            ) : null}
        </View>
    );
}
