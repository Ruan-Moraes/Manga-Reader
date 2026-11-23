import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { chapterReaderQueryOptions } from '@/entities/chapter';
import { getReadingProgress, type ReadingProgress, readingProgressQueryKeys, reportInvalidReadingProgress } from '@/entities/reading-progress';
import { useSessionStore } from '@/entities/session';
import { normalizeReaderSettings, ReaderSettingsControls } from '@/features/configure-chapter-reader';
import { useSettingsStore } from '@/features/manage-settings';
import { clampLogicalPage } from '@/features/navigate-chapter-reader';
import { createProgressSnapshot, isReadingProgressValidForChapter, ProgressSynchronizer, resolveResumeChoice } from '@/features/track-reading-progress';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, LoadingBlock, NavigationHeader, PageContainer, StateView, StatusMessage } from '@/shared/ui';
import { ContentReader, type ImageSequenceDocument } from '@/widgets/content-reader';

interface Props {
    titleId: string;
    requestedChapter: string;
}

interface IdentityProps extends Props {
    identityEpoch: number;
    isAuthenticated: boolean;
}

function IdentityReaderPage({ titleId, requestedChapter, identityEpoch, isAuthenticated }: IdentityProps) {
    const { t } = useTranslation('reader');
    const { spacing } = useTheme();
    const settings = useSettingsStore(state => state.settings);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const readerGestures = useSettingsStore(state => state.readerGestures);
    const synchronizer = useRef(new ProgressSynchronizer()).current;
    const [chapterNumber, setChapterNumber] = useState(requestedChapter);
    const [currentPage, setCurrentPage] = useState(1);
    const [resumeResolved, setResumeResolved] = useState(!isAuthenticated);
    const [pendingResume, setPendingResume] = useState<ReadingProgress | null>(null);
    const [suppressHydrationWrite, setSuppressHydrationWrite] = useState(false);
    const [syncError, setSyncError] = useState(false);
    const unavailableDiagnosticReported = useRef(false);
    const exitReader = () => navigateBackOrReplace(ROUTES.ROOT);

    const chapterQuery = useQuery(chapterReaderQueryOptions(titleId, chapterNumber));
    const progressQuery = useQuery({
        queryKey: readingProgressQueryKeys.byTitle(identityEpoch, titleId),
        queryFn: ({ signal }) => getReadingProgress(titleId, signal),
        enabled: isAuthenticated,
        retry: false,
    });
    const resume = resolveResumeChoice(requestedChapter, progressQuery.data ?? null, titleId);

    useEffect(() => {
        synchronizer.activate(isAuthenticated ? identityEpoch : null);
        return () => void synchronizer.deactivate();
    }, [identityEpoch, isAuthenticated, synchronizer]);

    useEffect(() => {
        if (!isAuthenticated || !progressQuery.isSuccess || resumeResolved || pendingResume || resume.kind === 'choose') return;
        if (!progressQuery.data) {
            setResumeResolved(true);
            return;
        }
        setPendingResume(progressQuery.data);
    }, [isAuthenticated, pendingResume, progressQuery.data, progressQuery.isSuccess, resume.kind, resumeResolved]);

    useEffect(() => {
        if (!pendingResume || !chapterQuery.data || chapterQuery.data.number !== pendingResume.chapterNumber || chapterQuery.data.pages.length === 0) return;
        const valid = isReadingProgressValidForChapter(pendingResume, chapterQuery.data.number, chapterQuery.data.pages.length);
        if (valid) {
            setCurrentPage(pendingResume.currentPage);
            setSuppressHydrationWrite(false);
        } else {
            reportInvalidReadingProgress(titleId);
            setCurrentPage(1);
            setSuppressHydrationWrite(true);
        }
        setPendingResume(null);
        setResumeResolved(true);
    }, [chapterQuery.data, pendingResume, titleId]);

    useEffect(() => {
        if (!pendingResume || unavailableDiagnosticReported.current) return;
        if (chapterQuery.isError || (chapterQuery.isSuccess && (!chapterQuery.data || chapterQuery.data.pages.length === 0))) {
            unavailableDiagnosticReported.current = true;
            reportInvalidReadingProgress(titleId);
        }
    }, [chapterQuery.data, chapterQuery.isError, chapterQuery.isSuccess, pendingResume, titleId]);

    useEffect(() => {
        if (!isAuthenticated || !resumeResolved || suppressHydrationWrite || !chapterQuery.data) return;
        const snapshot = createProgressSnapshot(titleId, chapterNumber, currentPage, chapterQuery.data.pages.length, settings.reader.autoMarkRead);
        if (!snapshot) return;
        synchronizer.queue(snapshot);
        const timeout = setTimeout(() => {
            void synchronizer.flush().then(() => setSyncError(synchronizer.getState().status === 'error'));
        }, 350);
        return () => clearTimeout(timeout);
    }, [
        chapterNumber,
        chapterQuery.data,
        currentPage,
        isAuthenticated,
        resumeResolved,
        settings.reader.autoMarkRead,
        suppressHydrationWrite,
        synchronizer,
        titleId,
    ]);

    const openRequestedChapter = () => {
        setPendingResume(null);
        setChapterNumber(requestedChapter);
        setCurrentPage(1);
        setSuppressHydrationWrite(false);
        setResumeResolved(true);
    };

    const readerDocument = useMemo<ImageSequenceDocument | null>(() => {
        if (!chapterQuery.data?.pages.length) return null;
        return {
            kind: 'IMAGE_SEQUENCE',
            id: chapterQuery.data.id,
            title: chapterQuery.data.title,
            chapterNumber: chapterQuery.data.number,
            sourceKind: 'PUBLISHED',
            initialLocation: { itemId: chapterQuery.data.pages[0].id, index: 0 },
            items: chapterQuery.data.pages.map(page => ({ id: page.id, primaryUri: page.imageUrl, width: page.width, height: page.height })),
        };
    }, [chapterQuery.data]);

    if (chapterQuery.isPending) {
        return (
            <PageContainer>
                <NavigationHeader backLabel={t('actions.exit')} onBack={exitReader} />
                <LoadingBlock label={t('states.loading')} />
            </PageContainer>
        );
    }
    if (chapterQuery.isError) {
        return (
            <PageContainer>
                <NavigationHeader backLabel={t('actions.exit')} onBack={exitReader} />
                <StateView
                    kind="error"
                    title={t('states.error')}
                    text={t('states.safeExit')}
                    retry={{ label: t('actions.retry'), onPress: () => void chapterQuery.refetch() }}
                    actions={
                        pendingResume ? (
                            <Button variant="outline" onPress={openRequestedChapter}>
                                {t('resume.requested')}
                            </Button>
                        ) : null
                    }
                />
            </PageContainer>
        );
    }
    if (!chapterQuery.data || chapterQuery.data.pages.length === 0) {
        return (
            <PageContainer>
                <NavigationHeader backLabel={t('actions.exit')} onBack={exitReader} />
                <StateView
                    kind="empty"
                    title={t('states.unavailable')}
                    text={t('states.safeExit')}
                    actions={
                        pendingResume ? (
                            <Button variant="outline" onPress={openRequestedChapter}>
                                {t('resume.requested')}
                            </Button>
                        ) : (
                            <Button onPress={exitReader}>{t('actions.exit')}</Button>
                        )
                    }
                />
            </PageContainer>
        );
    }

    if (isAuthenticated && progressQuery.isSuccess && resume.kind === 'choose' && !resumeResolved) {
        return (
            // Same frame as the other reader states: safe area and the visible way out (revisão 2026-11-13).
            <PageContainer>
                <NavigationHeader backLabel={t('actions.exit')} onBack={exitReader} />
                <View testID="reader-resume-choice" style={{ flex: 1, justifyContent: 'center', gap: spacing.md }}>
                    <AppText accessibilityRole="header" variant="title">
                        {t('resume.title')}
                    </AppText>
                    <AppText tone="muted">{t('resume.description', { chapter: resume.recent?.chapterNumber, page: resume.recent?.currentPage })}</AppText>
                    <View style={{ gap: spacing.xs }}>
                        <Button
                            onPress={() => {
                                setChapterNumber(resume.recent!.chapterNumber);
                                setPendingResume(resume.recent!);
                                unavailableDiagnosticReported.current = false;
                            }}
                        >
                            {t('resume.continue')}
                        </Button>
                        <Button variant="outline" onPress={openRequestedChapter}>
                            {t('resume.requested')}
                        </Button>
                    </View>
                </View>
            </PageContainer>
        );
    }

    const document = readerDocument!;
    const logicalPage = clampLogicalPage(currentPage, chapterQuery.data.pages.length);

    return (
        <ContentReader
            document={document}
            settings={settings.reader}
            gesturePreferences={readerGestures}
            location={{ itemId: chapterQuery.data.pages[logicalPage - 1].id, index: logicalPage - 1 }}
            settingsSheet={{
                content: (
                    <ReaderSettingsControls
                        compact
                        category="quick"
                        value={settings.reader}
                        onChange={patch => void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader')}
                    />
                ),
                onOpenAllSettings: () => router.push(ROUTES.SETTINGS.READER as never),
            }}
            statusContent={
                <>
                    {isAuthenticated && progressQuery.isError ? (
                        <StatusMessage
                            actionLabel={t('actions.retryProgressHydration')}
                            title={t('errors.progressHydration')}
                            onAction={() => void progressQuery.refetch()}
                            tone="danger"
                        />
                    ) : null}
                    {syncError ? (
                        <StatusMessage
                            actionLabel={t('actions.retryProgress')}
                            title={t('errors.progress')}
                            onAction={() => void synchronizer.retry().then(() => setSyncError(synchronizer.getState().status === 'error'))}
                            tone="danger"
                        />
                    ) : null}
                </>
            }
            onLocationChange={next => {
                setSuppressHydrationWrite(false);
                setCurrentPage(next.index + 1);
            }}
            onExit={exitReader}
        />
    );
}

export function ReaderPage(props: Props) {
    const { identityEpoch, isAuthenticated } = useSessionStore();
    const identityKey = `${isAuthenticated ? 'account' : 'guest'}:${identityEpoch}:${props.titleId}:${props.requestedChapter}`;

    return <IdentityReaderPage key={identityKey} {...props} identityEpoch={identityEpoch} isAuthenticated={isAuthenticated} />;
}
