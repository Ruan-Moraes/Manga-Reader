import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { chapterReaderQueryOptions, getImageVariantCapabilities } from '@/entities/chapter';
import { getReadingProgress, type ReadingProgress, readingProgressQueryKeys, reportInvalidReadingProgress } from '@/entities/reading-progress';
import { useSessionStore } from '@/entities/session';
import { normalizeReaderSettings } from '@/features/configure-chapter-reader';
import { useSettingsStore } from '@/features/manage-settings';
import { clampLogicalPage } from '@/features/navigate-chapter-reader';
import { createProgressSnapshot, isReadingProgressValidForChapter, ProgressSynchronizer, resolveResumeChoice } from '@/features/track-reading-progress';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { Button, EmptyState, NavigationHeader, PageContainer } from '@/shared/ui';
import { ChapterReader } from '@/widgets/chapter-reader';

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
    const { spacing, tokens, typography } = useTheme();
    const settings = useSettingsStore(state => state.settings);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const synchronizer = useRef(new ProgressSynchronizer()).current;
    const [chapterNumber, setChapterNumber] = useState(requestedChapter);
    const [currentPage, setCurrentPage] = useState(1);
    const [controlsVisible, setControlsVisible] = useState(true);
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

    if (chapterQuery.isPending) {
        return (
            <PageContainer>
                <NavigationHeader backLabel={t('actions.exit')} onBack={exitReader} />
                <EmptyState title={t('states.loading')} />
            </PageContainer>
        );
    }
    if (chapterQuery.isError) {
        return (
            <PageContainer>
                <NavigationHeader backLabel={t('actions.exit')} onBack={exitReader} />
                <EmptyState
                    title={t('states.error')}
                    description={t('states.safeExit')}
                    action={
                        <View style={{ gap: spacing.sm }}>
                            <Button onPress={() => void chapterQuery.refetch()}>{t('actions.retry')}</Button>
                            {pendingResume ? (
                                <Button variant="outline" onPress={openRequestedChapter}>
                                    {t('resume.requested')}
                                </Button>
                            ) : null}
                        </View>
                    }
                />
            </PageContainer>
        );
    }
    if (!chapterQuery.data || chapterQuery.data.pages.length === 0) {
        return (
            <PageContainer>
                <NavigationHeader backLabel={t('actions.exit')} onBack={exitReader} />
                <EmptyState
                    title={t('states.unavailable')}
                    description={t('states.safeExit')}
                    action={
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
            <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: tokens.bg }}>
                <Text accessibilityRole="header" style={{ color: tokens.text, fontSize: typography.h2 }}>
                    {t('resume.title')}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: typography.body }}>
                    {t('resume.description', { chapter: resume.recent?.chapterNumber, page: resume.recent?.currentPage })}
                </Text>
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
        );
    }

    return (
        <ChapterReader
            chapter={chapterQuery.data}
            settings={settings.reader}
            capabilities={getImageVariantCapabilities(chapterQuery.data.pages)}
            currentPage={clampLogicalPage(currentPage, chapterQuery.data.pages.length)}
            controlsVisible={controlsVisible}
            progressHydrationError={isAuthenticated && progressQuery.isError}
            syncStatus={syncError ? 'error' : 'idle'}
            onCurrentPageChange={page => {
                setSuppressHydrationWrite(false);
                setCurrentPage(page);
            }}
            onSettingsChange={patch => void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader')}
            onToggleControls={() => setControlsVisible(visible => !visible)}
            onExit={exitReader}
            onRetryProgress={() => void synchronizer.retry().then(() => setSyncError(synchronizer.getState().status === 'error'))}
            onRetryProgressHydration={() => void progressQuery.refetch()}
        />
    );
}

export function ReaderPage(props: Props) {
    const { identityEpoch, isAuthenticated } = useSessionStore();
    const identityKey = `${isAuthenticated ? 'account' : 'guest'}:${identityEpoch}:${props.titleId}:${props.requestedChapter}`;

    return <IdentityReaderPage key={identityKey} {...props} identityEpoch={identityEpoch} isAuthenticated={isAuthenticated} />;
}
