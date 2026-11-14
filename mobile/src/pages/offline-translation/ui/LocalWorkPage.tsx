import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { navigateBackOrReplace, ROUTES, useScreenRefocus } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { IconButton, ScreenScaffold } from '@/shared/ui';
import { WorkDetail } from '@/widgets/local-translation-library';
import { BatchRetrySheet } from '@/widgets/remote-processing';

export function LocalWorkPage({ workId }: { workId: string }) {
    const { t } = useTranslation('localTranslation');
    const { t: launcher } = useTranslation('launcher');
    const { spacing } = useTheme();
    const [focusToken, setFocusToken] = useState(0);
    const [retry, setRetry] = useState<string | null>(null);
    const [retryMode, setRetryMode] = useState<'retry' | 'translate'>('retry');
    // WorkDetail already loads on mount; only a return to this screen needs a reload (no double load on open).
    useScreenRefocus(() => setFocusToken(value => value + 1));
    const openReader = (projectId: string) => router.push({ pathname: ROUTES.TRANSLATION_READER, params: { projectId } } as never);
    const closeRetry = () => {
        setRetry(null);
        setFocusToken(value => value + 1);
    };
    return (
        <>
            <WorkDetail
                workId={workId}
                refreshToken={focusToken}
                onOpenReader={openReader}
                onNewChapter={target => router.push({ pathname: ROUTES.OFFLINE_TRANSLATION, params: target } as never)}
                onRetryChapter={projectId => {
                    setRetryMode('retry');
                    setRetry(projectId);
                }}
                onTranslateChapter={projectId => {
                    setRetryMode('translate');
                    setRetry(projectId);
                }}
                onMissing={() => router.replace(ROUTES.TRANSLATION_LIBRARY as never)}
                scaffold={({ title, children, stickyFooter, hasChapters }) => (
                    <ScreenScaffold
                        compact
                        backShape="control"
                        backLabel={t('actions.back')}
                        onBack={() => navigateBackOrReplace(ROUTES.TRANSLATION_LIBRARY)}
                        headerAction={
                            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                                {hasChapters ? (
                                    <IconButton
                                        accessibilityLabel={t('work.manage')}
                                        icon="settings-outline"
                                        onPress={() => router.push({ pathname: ROUTES.WORK_MANAGE, params: { workId } } as never)}
                                    />
                                ) : null}
                                <IconButton
                                    accessibilityLabel={launcher('navigation.home')}
                                    icon="home-outline"
                                    onPress={() => router.replace(ROUTES.ROOT as never)}
                                />
                            </View>
                        }
                        title={title}
                        stickyFooter={stickyFooter}
                    >
                        {children}
                    </ScreenScaffold>
                )}
            />
            <BatchRetrySheet
                visible={retry !== null}
                onClose={closeRetry}
                closeLabel={t('menu.close')}
                title={retryMode === 'translate' ? t('work.translateTitle') : t('work.retryTitle')}
                description={retryMode === 'translate' ? t('work.translateDescription') : t('work.retryDescription')}
                projectId={retry ?? ''}
                onOpenReader={projectId => {
                    closeRetry();
                    openReader(projectId);
                }}
            />
        </>
    );
}
