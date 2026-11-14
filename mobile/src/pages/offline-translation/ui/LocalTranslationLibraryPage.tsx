import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ROUTES, useScreenRefocus } from '@/shared/navigation';
import { IconButton, ScreenScaffold } from '@/shared/ui';
import { LibraryShelf } from '@/widgets/local-translation-library';
import { BatchRetrySheet } from '@/widgets/remote-processing';

export function LocalTranslationLibraryPage() {
    const { t } = useTranslation('localTranslation');
    const { t: launcher } = useTranslation('launcher');
    const [focusToken, setFocusToken] = useState(0);
    // The shelf already loads on mount; only a return to this screen needs a reload (no double load on open).
    useScreenRefocus(() => setFocusToken(value => value + 1));
    const [batchProject, setBatchProject] = useState<string | null>(null);
    const home = () => router.replace(ROUTES.ROOT as never);
    const openReader = (projectId: string) => router.push({ pathname: ROUTES.TRANSLATION_READER, params: { projectId } } as never);
    const closeBatch = () => {
        setBatchProject(null);
        setFocusToken(value => value + 1);
    };
    return (
        <>
            <LibraryShelf
                refreshToken={focusToken}
                onOpenWork={workId => router.push({ pathname: ROUTES.WORK, params: { workId } } as never)}
                onOpenReader={openReader}
                onTranslate={() => router.push(ROUTES.OFFLINE_TRANSLATION as never)}
                onTranslateChapter={setBatchProject}
                scaffold={({ children, stickyFooter }) => (
                    <ScreenScaffold
                        compact
                        backShape="control"
                        backLabel={t('actions.back')}
                        onBack={home}
                        headerAction={<IconButton accessibilityLabel={launcher('navigation.home')} icon="home-outline" onPress={home} />}
                        title={t('shelf.title')}
                        stickyFooter={stickyFooter}
                    >
                        {children}
                    </ScreenScaffold>
                )}
            />
            <BatchRetrySheet
                visible={batchProject !== null}
                onClose={closeBatch}
                closeLabel={t('menu.close')}
                title={t('work.translateTitle')}
                description={t('work.translateDescription')}
                projectId={batchProject ?? ''}
                onOpenReader={projectId => {
                    closeBatch();
                    openReader(projectId);
                }}
            />
        </>
    );
}
