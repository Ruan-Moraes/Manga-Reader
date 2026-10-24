import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/shared/navigation';
import { ScreenScaffold } from '@/shared/ui';
import { LocalTranslationLibrary } from '@/widgets/local-translation-library';

export function LocalTranslationLibraryPage() {
    const { t } = useTranslation('localTranslation');
    return (
        <ScreenScaffold compact backLabel={t('actions.back')} onBack={() => router.replace(ROUTES.ROOT as never)} title={t('library.title')}>
            <LocalTranslationLibrary
                onCreate={() => router.push(ROUTES.OFFLINE_TRANSLATION as never)}
                onOpen={projectId => router.push({ pathname: ROUTES.TRANSLATION_READER, params: { projectId } } as never)}
            />
        </ScreenScaffold>
    );
}
